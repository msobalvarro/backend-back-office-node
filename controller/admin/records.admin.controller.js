const express = require('express')
const router = express.Router()

const WriteError = require('../../logs/write.config')
const { downloadFile } = require('../../configuration/constant.config')

// Sql transaction
const sql = require("../../configuration/sql.config")
const {
    getAllRecords,
    getRecordDetails,
    getUserAvatarPicture
} = require("../../configuration/queries.sql")

router.get('/', async (_, res) => {
    try {
        const response = await sql.run(getAllRecords)

        res.send(response[0])
    } catch (error) {
        /**Error information */
        WriteError(`records.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        const response = await sql.run(getRecordDetails, [id])

        res.status(200).send(response[0][0])

    } catch (error) {
        /**Error information */
        WriteError(`records.js - catch execute sql | ${error}`)

        res.send({ error: true, message: error })
    }
})

router.get('/:id/avatar', async (req, res) => {
    try {
        const { id } = req.params

        // Obtiene ls información del avatar del usuario
        const result = await sql.run(getUserAvatarPicture, [id])

        if (result.length === 0) {
            throw String('Avatar picture not exist')
        }

        // Se extrae el nombre y el tipo de archivo
        const { filename, type } = result[0]

        // Se obtiene la imagen desde el bucket
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
    } catch (message) {
        WriteError(`records.admin.controller.js | Error to get user avatar | ${message.toString()}`)

        res.send({
            error: true,
            message
        })
    }
})

module.exports = router