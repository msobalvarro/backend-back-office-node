const express = require('express')
const router = express.Router()
const log = require('../../logs/write.config')

// Send Email APi
const sendEmail = require("../../configuration/send-email.config")
const { getHTML } = require("../../configuration/html.config")
const { EMAILS } = require("../../configuration/constant.config")

// Middlewares
const { check, validationResult } = require('express-validator')

// Sql transaction
const sql = require("../../configuration/sql.config")
const { getAllUpgrades, getUpgradeDetails, declineUpgrade, acceptUpgrade } = require("../../configuration/queries.sql")

/**
 * Controlador que enlista todas los solicitudes de upgrades
 */
router.get('/', async (_, res) => {
    try {
        const response = await sql.run(getAllUpgrades)

        res.status(200).send(response[0])
    } catch (error) {
        /**Error information */
        log(`request.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**
 * Controlador que retorna el detalle de un upgrade
 */
router.post('/id', [check('id', 'ID is not valid').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { id } = req.body

        const response = await sql.run(getUpgradeDetails, [id])

        res.status(200).send(response[0][0])

    } catch (error) {
        /**Error information */
        log(`request.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**Controlador que rechaza una solicitud de upgrade */
router.delete('/decline', [check('id', 'ID is not valid').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id } = req.body

        await sql.run(declineUpgrade, [id])

        res.status(200).send({ response: 'success' })

    } catch (error) {
        /**Error information */
        log(`request.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**Controlador que acepta una solicitud de upgrade */
router.post('/accept', [check('data', 'data is not valid').exists()], async (req, res) => {
    try {
        const errors = validationResult(req)

        // verificamos si hay algun error
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // obtenemos el parametro 
        const { data } = req.body

        // ejecutamos la consulta
        await sql.run(acceptUpgrade, [data.id])

        const dataHTML = {
            name: data.name,
            amount: data.amount_requested,
            typeCoin: (data.id_currency === 1 ? "BTC" : "ETH").toString()
        }

        const html = await getHTML("investment-upgrade.html", dataHTML)

        const config = {
            to: data.email,
            from: EMAILS.DASHBOARD,
            subject: `Upgrade - ${dataHTML.typeCoin}`,
            html
        }

        await sendEmail(config)

        res.send({ response: "success" })

    } catch (message) {
        /**Error information */
        log(`upgrades.admin.controller.js - accept upgrade | ${message.toString()}`)

        res.send({ error: true, message })
    }
})

module.exports = router