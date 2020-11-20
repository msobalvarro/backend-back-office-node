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
    allowsFileTypes,
    imageFileTypes
} = require("../configuration/constant.config")

// Middleware
const { auth } = require("../middleware/auth.middleware")

// Escritura en el registro de errores
const WriteError = require("../logs/write.config")

// Guardar imagenes en el bucket para los usuarios
router.post("/", auth, multer({ limits: { fieldSize: 7 * 1024 * 1024 } }).single("image"), async (req, res) => {

    try {

        // Se verefica que se haya enviado un archivo, se arroja el error
        if (!req.file) {
            throw String("image is required")
        }

        // Se verifica sí el archivo ya existe y se va a actualizar
        const { idFile = null } = req.body

        // Se obtiene el nombre, tipo y tamaño del archivo recibido
        const {
            originalname: filename,
            mimetype: type,
            size
        } = req.file

        let filenameBucket = ''
        /**
         * Extensión del archivo recibido y nombre que tendrá el archivo dentro del bucket
         */
        let fileextensionBucket = ''

        // se obtiene la info del archivo en caso de que exista
        const storageFile = await sql.run(getFileById, [idFile])

        // En caso de que se vaya a actualizar el archivo, se obtiene la info que se tiene registrada
        if (storageFile.length > 0) {
            filenameBucket = storageFile[0].name
        } else {
            fileextensionBucket = (imageFileTypes.indexOf(type) === -1)
                ? filename.split('.').reverse()[0]
                : 'jpg'

            filenameBucket = `${uuid()}.${fileextensionBucket}`
        }

        // Se verifica que el tipo de archivo sea uno válido
        if (allowsFileTypes.indexOf(type) === -1) {
            throw String("file type is not allowed")
        }

        const filetype = (imageFileTypes.indexOf(type) !== -1)
            ? "image/jpeg"
            : type


        const {
            result: uploadResult,
            error: uploadError
        } = await uploadFile(req.file, filenameBucket, filetype)

        if (!uploadResult) {
            throw uploadError
        }

        let fileId = null

        if (idFile === null) {
            // Se almacena el registro del archivo dentro de la BD
            const result = await sql.run(
                insertionFiles,
                [filenameBucket, filetype, size, 0, idFile]
            )

            // Sí la consulta no retorna una respuesta, se lanza el error
            if (!(result[0].length > 0)) {
                throw String("Error sql query on insertionFiles")
            }

            // Se obtiene el id del registro dentro de la BD
            const { response } = result[0][0]
            fileId = response
        } else {
            fileId = idFile
        }

        res.status(200).json({
            fileId
        })
    } catch (error) {
        // Escribe el error en el registro
        WriteError(`file.controller.js | upload file | ${error}`)

        res.send({
            error: true,
            message: error
        })
    }
})


// Obtener las imagenes desde el bucket patra los usuarios
router.post("/:id", (_, res) => res.status(500).send(""))

router.get("/:id", auth, async (req, res) => {
    try {
        // Se verifica que se haya recibido del nombre del archivo dentro del bucket
        if (!req.params.id) {
            throw String("filename bucket is required")
        }

        // Se obtiene el nombre del archivo de la BD
        const result = await sql.run(getFileById, [req.params.id])

        // Si no existe el archivo, se retorna el error
        if (!result.length > 0) {
            throw String("request file not exist")
        }

        const {
            name: filename,
            type,
            admin
        } = result[0]

        /**
         * Se verifica que el permiso de acceso sea solo para usuario
         */
        if (admin) {
            throw String("you don't have permission to access the file")
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
            'Filename': filename,
            'Cache-Control': 'no-cache',
            'Content-Type': type,
            'Content-Length': data.length
        })

        res.send(data[0])
    } catch (error) {
        // Escribe el error en el registro
        WriteError(`file.controller.js | download file | ${error}`)

        res.send({
            error: true,
            message: error
        })
    }
})

module.exports = router