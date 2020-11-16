const { Router } = require("express")
const router = Router()

// import functions
const log = require("../logs/write.config")
const fs = require("fs")
const multer = require("multer")

//import mysql configuration
const sql = require("../configuration/sql.config")
const {
    insertNewTerm,
    updateExistTerm,
    getTermByName,
    getAllTerms
} = require("../configuration/queries.sql")

// import constants
const { getHTML } = require("../configuration/html.config")

// import middlewares
const { authRoot } = require("../middleware/auth.middleware")

/**Instancia de multer */
const upload = multer({ dest: "/tmp/" }).single("file")


/**Funcion que lee archivos de text */
const readFileText = (file) => new Promise((resolve, reject) => {
    try {
        // verificamos si el archivo es un txt
        if (file.mimetype !== "text/plain") {
            throw String("Archivo no admitido (file is not txt)")
        }

        // leemos y reasignamos en una variable
        fs.readFile(file.path, {},
            (e, data) => {
                // verificamos si hay algun error
                if (e) {
                    throw String(e.message)
                }

                // retornamos el contenido de un txt
                resolve(data.toString().trim())
            })
    } catch (error) {
        reject(error)
    }
})

/**
 * Controlador que retorna los terminos y condiciones
 */
router.get("/read/:key", async (req, res) => {
    try {
        // obtenemos el key de los terminos
        const { key } = req.params

        // verificamos que si viene un key
        if (!key) {
            throw String("Page not Found")
        }

        // Obtenemos los datos
        const dataSQL = await sql.run(getTermByName, [key.toLowerCase()])


        if (dataSQL.length === 0) {
            throw String("Page not Found")
        }

        // obtenemos la plantilla de terminos
        const html = await getHTML("terms.html", { text: dataSQL[0].description })

        res.send(html)
    } catch (message) {
        log(`terms.controller.js | Get data | ${message.toString()}`)


        const html = await getHTML("error-server.html", { code: 500, message })

        res.send(html)
    }
})

/**
 * Controlador que obtiene la lista de los terminos y condiciones
 */
router.get("/list", authRoot, async (_, res) => {
    try {
        const dataSQL = await sql.run(getAllTerms)


        res.send(dataSQL)
    } catch (message) {
        log(`terms.controller.js | get list | ${message.toString()}`)

        res.send({ error: true, message })
    }
})

/**
 * Controlador que agrega un termino y condición
 */
router.post("/add", authRoot, upload, async (req, res) => {
    try {
        // obtenemos el id de los terminos 
        const { key = null, description = null } = req.body

        // verificamos todos los parametros
        if (
            (!key || typeof key !== "string") ||
            ((!description || typeof description !== "string") && !req.file)
        ) {
            throw String("Params is not defined")
        }

        // constante que guardara el texto de los terminos
        const textTerms = req.file
            ? await readFileText(req.file)
            : description

        // verificamos que si el archivo esta vacio
        if (textTerms.length === 0) {
            throw String("Archivo vacio, escriba algun termino")
        }

        const result = await sql.run(getTermByName, [key])

        if (result.length > 0) {
            // Actualizamos los datos existentes
            await sql.run(updateExistTerm, [textTerms, key.toLowerCase()])
        } else {
            // ejecutamos la consulta para guardar los datos
            await sql.run(insertNewTerm, [key.toLowerCase(), textTerms])
        }

        res.send({ response: "success" })

    } catch (message) {
        log(`terms.controller.js | add term | ${message.toString()}`)

        res.send({ error: true, message })
    }
})


module.exports = router