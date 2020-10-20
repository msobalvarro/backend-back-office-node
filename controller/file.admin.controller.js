const express = require("express")
const router = express.Router()

// Database
const sql = require("../configuration/sql.config")
const { insertionFiles, getFileById } = require("../configuration/queries.sql")

// Import utils
const { v4: uuid } = require("uuid")
const multer = require("multer")
const {
    uploadFile,
    downloadFile,
    allowsFileTypes
} = require("../configuration/constant.config")

// Middleware
const { authRoot } = require("../middleware/auth.middleware")

// Escritura en el registro de errores
const WriteError = require("../logs/write.config")

// Import vars
const { EMAIL_IMAGE_TOKEN } = require("../configuration/vars.config")


// Callback para guardar imagenes en el bucket
const saveImageIntoBucket = async (req, res) => {
    try {
        // Se verefica que se haya enviado un archivo, se arroja el error
        if (!req.file) {
            throw String("image is required")
        }

        // Se obtiene el nombre, tipo y tamaño del archivo recibido
        const {
            originalname: filename,
            mimetype: type,
            size
        } = req.file

        /**
         * Extensión del archivo recibido y nombre que tendrá el archivo dentro del bucket
         */
        const extension = filename.split('.').reverse()[0],
            filenameBucket = (req.route.path === "/email")
                ? `emailsource-${uuid()}.${extension}`
                : `${uuid()}.${extension}`

        // Se verifica que el tipo de archivo sea uno válido
        if (allowsFileTypes.indexOf(type) === -1) {
            throw String("file type is not allowed")
        }


        const {
            result: uploadResult,
            error: uploadError
        } = await uploadFile(req.file, filenameBucket)

        if (!uploadResult) {
            throw uploadError
        }

        // Se almacena el registro del archivo dentro de la BD
        const result = await sql.run(
            insertionFiles,
            [filenameBucket, type, size, 1]
        )

        // Sí la consulta no retorna una respuesta, se lanza el error
        if (!(result[0].length > 0)) {
            throw String("Error sql query on insertionFiles")
        }

        // Se obtiene el id del registro dentro de la BD
        const { response: fileId } = result[0][0]

        res.status(200).json({
            fileId
        })
    } catch (error) {
        // Escribe el error en el registro
        WriteError(`file.admin.controller.js | upload file | ${error}`)

        res.send({
            error: true,
            message: error
        })
    }
}


// Guarda una imagen en el bucket de archivos
router.post("/", authRoot, multer().single("image"), saveImageIntoBucket)
router.get("/", (_, res) => res.status(500).send(""))
router.post("/email", authRoot, multer().single("image"), saveImageIntoBucket)


// Callback a ejecutar para los endpoints de obtener las imagenes desde el bucket
const getFileFromBucket = async (req, res) => {
    try {
        // Se verifica que se haya recibido del nombre del archivo dentro del bucket
        if (!req.params.id) {
            throw String("filename bucket is required")
        }

        /**
         * Si se consume el endpoint para las imagenes de los correos, se verifica el
         * token de acceso
         */
        if (req.route.path === "/email/:id" && !req.query.token) {
            throw String("access picture token is required")
        }

        if (req.route.path === "/email/:id" && req.query.token !== EMAIL_IMAGE_TOKEN) {
            throw String("access picture token is invalid")
        }

        // Se obtiene el nombre del archivo de la BD
        const result = await sql.run(getFileById, [req.params.id])

        // Si no existe el archivo, se retorna el error
        if (!result.length > 0) {
            throw String("request file not exist")
        }

        const {
            name: filename,
            type
        } = result[0]

        /**
         * Si se consume el endpoint para las imagenes del correo, se verifica que
         * contenga su respectivo prefijo
         */
        if (req.route.path === "/email/:id" && !filename.startsWith("emailsource-")) {
            throw String("filename is not a imagesource for email")
        }

        const {
            result: downloadResult,
            data,
            error: downloadError
        } = await downloadFile(filename)

        if (!downloadResult) {
            throw downloadError
        }

        res.set({
            'Cache-Control': 'no-cache',
            'Content-Type': type,
            'Content-Length': data.length
        })

        res.send(data[0])
    } catch (error) {
        // Escribe el error en el registro
        WriteError(`file.admin.controller.js | download file | ${error}`)

        res.send({
            error: true,
            message: error
        })
    }
}

// Obtiene una imagen desde el bucket
router.get("/:id", authRoot, getFileFromBucket)
router.post("/:id", (_, res) => res.status(500).send(""))
router.get("/email/:id", getFileFromBucket)

module.exports = router