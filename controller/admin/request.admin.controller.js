const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const log = require('../../logs/write.config')
const registerAction = require('../../logs/actions/actions.config')
const _ = require("lodash")

// Email Api and Email from Constant
const email = require("../../configuration/send-email.config")
const { getHTML } = require("../../configuration/html.config")
const { EMAILS, socketAdmin, eventSocketNames } = require("../../configuration/constant.config")

// Sql transaction
const sql = require("../../configuration/sql.config")
const { getAllRequest, getRequestDetails, declineRequest, acceptRequest, getRequestInvestmentDetails } = require("../../configuration/queries.sql")


/**
 * Controlador que enlista todas las solicitudes de compras de planes
 */
router.get('/', async (_, res) => {
    try {
        const response = await sql.run(getAllRequest)

        res.status(200).send(response[0])
    } catch (error) {
        /**Error information */
        log(`request.admin.controller.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**
 * Controlador que retorna la informacion detallada de la solictud de acivacion de plan
 */
router.get('/details/:id', async (req, res) => {
    try {
        const { id } = req.params

        // Convertimos el id del plan en un entero
        const id_investment = parseInt(id)

        // verificamos si el id del plan es correcto/incorrectp
        if (isNaN(id_investment)) {
            throw String("Ciertos datos no se encontraron")
        }

        // ejecutamos
        const response = await sql.run(getRequestInvestmentDetails, [id])

        res.status(200).send(response[0])

    } catch (error) {
        /**Error information */
        log(`request.admin.controller.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**
 * Controlador que ejcuta el rechazo de un plan de inversion
 */
router.delete('/decline', [check('id', 'ID is not valid').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { id } = req.body

        // await sql.run(declineRequest, [id])
        
        // Registramos la accion
        registerAction({ name: req.user.name, action: `Ha rechazado el plan: [ID: ${id}]` })

        // enviamos notificacion socket
        socketAdmin.emit(eventSocketNames.removeRegister, id)

        res.status(200).send({ response: 'success' })

    } catch (error) {
        /**Error information */
        log(`request.admin.controller.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**
 * Controlador que ejecuta la aceptacion solitud de plan de inversion
 */
router.post('/accept', [check('data', 'data is not valid').exists()],
    async (req, res) => {
        try {
            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                throw String(errors.array()[0].msg)
            }

            const { data } = req.body

            console.log(data)

            // generamos la consulta para aceptar
            await sql.run(acceptRequest, [data.id])

            const symbol = data.id_currency === 1 ? "BTC" : "ETH"

            // creamos la plantilla de correo 
            // para notificar al inversor que su plan ha sido activado
            const html = await getHTML("investment-received.html", { name: data.name, amount: data.amount, typeCoin: symbol })

            // creamos las configuraciones para el envio del correo
            const msgInvestor = {
                to: data.email,
                from: EMAILS.DASHBOARD,
                subject: `Plan de Inversion en ${data.id_currency === 1 ? "Bitcoin" : "Ethereum"}`,
                html,
            }

            // enviamos la notificacion
            await email(msgInvestor)

            registerAction({ name: req.user.name, action: `Ha Aprobado el plan de "${data.name}": [Monto: ${data.amount} ${symbol}]` })

            // enviamos notificacion socket
            socketAdmin.emit(eventSocketNames.removeRegister, data.id)

            res.send({ response: "success" })

        } catch (message) {
            /**Error information */
            log(`request.admin.controller.js | ${message.toString()}`)

            res.send({ error: true, message })
        }
    })

module.exports = router