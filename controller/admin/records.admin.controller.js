const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

const WriteError = require('../../logs/write.config')
const { downloadFile } = require('../../configuration/constant.config')

// Sql transaction
const sql = require("../../configuration/sql.config")
const {
    getAllRecords,
    getRecordDetails,
    getInvestmentExpireInfo,
    getUserAvatarPicture,
    insertControlUserQuestion,
    getControlUserQuestion
} = require("../../configuration/queries.sql")


/**
 * Obtiene la lista de los usuarios registrados
 */
router.get('/', async (_, res) => {
    try {
        const response = await sql.run(getAllRecords)

        res.send(response[0])
    } catch (error) {
        /**Error information */
        WriteError(`records.js - catch execute sql | ${error}`)

        res.send({ error: true, message: error })
    }
})

/**
 * Obtiene el detalle de una cuenta de usuario
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        // Obtiene la información general del usuario
        const resultDetail = await sql.run(getRecordDetails, [id])

        // Se construye la respuesta de la petición
        const response = {
            ...resultDetail[0][0]
        }

        // Se obtiene la información de la expiración del plan
        const resultInvestmentExpireInfo = await sql.run(getInvestmentExpireInfo, [id])

        for (let item of resultInvestmentExpireInfo) {
            const coin = item.currency.toLowerCase()

            // Monto a duplicar
            response[`amount_duplicate_${coin}`] = item.amount_duplicate
            // Monto de los retiros realizados
            response[`withdrawals_${coin}`] = item.withdrawals
            // Porcentaje de avance del plan
            response[`percentage_${coin}`] = item.percentage
            // Fecha de inicio del plan
            response[`date_plan_${coin}`] = item.start_date_plan
        }

        const resultControlQuestion = await sql.run(getControlUserQuestion, [id])

        response.controlQuestion = (resultControlQuestion.length > 0)
            ? resultControlQuestion[0]
            : {}

        res.send(response)
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

        res.send({ error: true, message })
    }
})


const checkParams = [
    check('question', 'User Security Question is required').exists().isNumeric(),
    check('response', 'User Response Security Question is required').exists().isString()
]

router.post('/:id/security-question', checkParams, async (req, res) => {
    try {
        const errors = validationResult(req)

        // validamos el error de los paramtros
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { id } = req.params
        const { question, response } = req.body

        console.log(`user: ${id} - question: ${question} | response: ${response}`)

        await sql.run(insertControlUserQuestion, [id, question, response])

        res.send({ success: true })
    } catch (message) {
        WriteError(`records.admin.controller.js | Error to save security question | ${message.toString()}`)

        res.send({ error: true, message })
    }
})

module.exports = router