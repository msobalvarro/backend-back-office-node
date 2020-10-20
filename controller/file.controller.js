const express = require("express")
const router = express.Router()

// gcloud storage client
const { Storage } = require("@google-cloud/storage")

// Database
const sql = require("../configuration/sql.config")
const { insertionFiles, getFileById } = require("../configuration/queries.sql")

// Import utils
const { v4: uuid } = require("uuid")
const multer = require("multer")

// Escritura en el registro de errores
const WriteError = require("../logs/write.config")

// MiddleWare
const { auth } = require('../middleware/auth.middleware')

// Import vars
const {
    GCLOUD_FILES_STORAGE_BUCKET,
    GCLOUD_ACCOUNT_SERVICE_CREDENTIAL,
    EMAIL_IMAGE_TOKEN
} = require("../configuration/vars.config")


// Mime-types para los archivos permitidos
const allowsTypes = [
    "image/jpeg",
    "image/svg+xml",
    "image/png",
    "application/x-abiword",
    "application/msword",
    "application/pdf"
]

// Instancia del bucket
const bucket = new Storage({
    keyFilename: GCLOUD_ACCOUNT_SERVICE_CREDENTIAL
}).bucket(GCLOUD_FILES_STORAGE_BUCKET)


// Callback para guardar imagenes en el bucket
const saveImageIntoBucket = async (req, res) => {
    try {
        // Se verefica que se haya enviado un archivo, se arroja el error
        if (!req.file) {
            res.status(400)
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
        if (allowsTypes.indexOf(type) === -1) {
            res.status(400)
            throw String("file type is not allowed")
        }


        // Se prepara la escritura del archivo en el bucket
        const stream = bucket.file(filenameBucket)
            .createWriteStream({
                resumable: true,
                contentType: type
            })

        // Se establecen los eventos del proceso de escritura
        stream
            .on('error', err => {
                res.status(500)
                throw String(err)
            }).on('finish', async _ => {
                try {
                    // Se almacena el registro del archivo dentro de la BD
                    const result = await sql.run(
                        insertionFiles,
                        [filenameBucket, type, size]
                    )

                    // Sí la consulta no retorna una respuesta, se lanza el error
                    if (!(result[0].length > 0)) {
                        res.status(500)
                        throw String("Error sql query on insertionFiles")
                    }

                    // Se obtiene el id del registro dentro de la BD
                    const { response: fileId } = result[0][0]

                    res.status(200).json({
                        fileId
                    })
                } catch (errorStream) {
                    // Captura los errores dentro del stream
                    // Escribe el error en el registro
                    WriteError(`file.controller.js | ${errorStream}`)

                    res.send({
                        error: true,
                        message: errorStream
                    })
                }
            })

        // Se invoca la escritura del archivo
        stream.end(req.file.buffer)
    } catch (error) {
        // Escribe el error en el registro
        WriteError(`file.controller.js | ${error}`)

        res.send({
            error: true,
            message: error
        })
    }
}


// Guarda una imagen en el bucket de archivos
router.post("/", auth, multer().single("image"), saveImageIntoBucket)
router.get("/", (_, res) => res.status(500).send(""))
router.post("/email", auth, multer().single("image"), saveImageIntoBucket)


// Callback a ejecutar para los endpoints de obtener las imagenes desde el bucket
const getFileFromBucket = async (req, res) => {
    try {
        // Se verifica que se haya recibido del nombre del archivo dentro del bucket
        if (!req.params.id) {
            res.status(400)
            throw String("filename bucket is required")
        }

        /**
         * Si se consume el endpoint para las imagenes de los correos, se virifica el
         * token de acceso
         */
        if (req.route.path === "/email/:id" && !req.query.token) {
            res.status(400)
            throw String("access picture token is required")
        }

        if (req.route.path === "/email/:id" && req.query.token !== EMAIL_IMAGE_TOKEN) {
            res.status(401)
            throw String("access picture token is invalid")
        }

        // Se obtiene el nombre del archivo de la BD
        const result = await sql.run(getFileById, [req.params.id])

        // Si no existe el archivo, se retorna el error
        if (!result.length > 0) {
            res.status(404)
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
            res.status(400)
            throw String("filename is not a imagesource for email")
        }

        const blob = bucket.file(filename)

        // Verificando si el archivo existe en el bucket
        const [exist] = await blob.exists()

        if (!exist) {
            res.status(404)
            throw String("request file not exist")
        }

        // Se carga el archivo desde el bucket y se envía el buffer como respuesta

        blob.download().then(data => {
            res.set({
                'Cache-Control': 'no-cache',
                'Content-Type': type,
                'Content-Length': data.length
            })

            res.send(data[0])
        })
    } catch (error) {
        res.status(500)

        res.send({
            error: true,
            message: error
        })
    }
}

// Obtiene una imagen desde el bucket
router.get("/:id", auth, getFileFromBucket)
router.post("/:id", (_, res) => res.status(500).send(""))
router.get("/email/:id", getFileFromBucket)

module.exports = router