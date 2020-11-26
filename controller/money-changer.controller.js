const express = require("express")
const router = express.Router()

// Write log error
const log = require('../logs/write.config')

// Imports middlewares
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum, dash, litecoin } = require("../middleware/hash.middleware")
const { authRoot } = require("../middleware/auth.middleware")

// Import Sql config and sql
const sql = require("../configuration/sql.config")
const { createMoneyChangerRequest, getMoneyChangerRequest, setInactiveChangeRequest, declineMoneyChangerRequest } = require("../configuration/queries.sql")

// Imports SendEmail Function
const sendEmail = require("../configuration/send-email.config")
const { EMAILS, socketAdmin, eventSocketNames } = require("../configuration/constant.config")

// Import HTML Template Function
const { getHTML } = require("../configuration/html.config")

// Api para obtener todas las solicitudes
router.get("/", authRoot, (_, res) => {
    try {
        sql.run(getMoneyChangerRequest)
            .then(response => {
                res.send(response)
            })
            .catch(reason => {
                throw reason.toString()
            })
    } catch (error) {
        log(`money-changer.controller.js - API get all request - ${error.toString()}`)
    }
})

// Middlewares para validacion de peticion aceptar solicitud
const checkParamsRequestAccept = [
    authRoot,
    [
        check("data", "Data request is require").exists(),
    ]
]

router.post("/accept", checkParamsRequestAccept, async (req, res) => {
    try {
        const { data } = req.body

        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Parametros que remplazan la plantilla de correo
        const args = {
            amount: data.amount_usd,
            symbol: data.coin_name,
            hashType: data.type === "buy" ? "Hash" : "ID transacción",
            type: data.type === "buy" ? "compra" : "venta",
            hash: data.hash
        }

        // Construimos la plantilla de correo y remplazamos las variables
        const html = await getHTML("accept-money-changer.html", args)

        // Enviamos el correo
        sendEmail({ from: EMAILS.EXCHANGE, to: data.email_airtm, subject: "Money Changer", html })

        // ejecutamos la consutla
        await sql.run(setInactiveChangeRequest, [data.id])

        // notificamos con el socket
        socketAdmin.emit(eventSocketNames.removeMoneyChanger, data.id)

        res.send({ response: "success" })

    } catch (error) {
        log(`money-changer.controller.js - Accept Request - ${error.toString()}`)

        const errors = {
            error: true,
            message: error.toString()
        }

        res.send(errors)
    }
})

// Middlewares para validacion de peticion rechazar solicitud
const checkParamsRequestDecline = [
    authRoot,
    [
        check("data", "Data request is required").exists(),
        check("send", "send email check is requerid").isBoolean().exists(),
        check("reason", "Reason param is required").exists().isString(),
    ]
]

router.post("/decline", checkParamsRequestDecline, async (req, res) => {
    try {
        const { data, send, reason } = req.body

        // ejecutamos la consulta
        await sql.run(declineMoneyChangerRequest, [data.id, reason])


        // veriricamos si el admin quiere notificar al usuario
        if (send) {
            // Parametros que remplazan la plantilla de correo
            const args = {
                type: data.type === "buy" ? "compra" : "venta",
                reason,
            }

            // Construimos la plantilla de correo y remplazamos las variables
            const html = await getHTML("decline-money-changer.html", args)

            const subject = data.type === "buy" ? "Compra fallida" : "Venta fallida"

            // Enviamos el correo
            sendEmail({ from: EMAILS.EXCHANGE, to: data.email_airtm, subject, html })
        }

        // notificamos con el socket
        socketAdmin.emit(eventSocketNames.removeMoneyChanger, data.id)

        res.send({ response: "success" })
    } catch (error) {
        log(`money-changer.controller.js - Decline Request - ${error.toString()}`)

        const errors = {
            error: true,
            message: error.toString()
        }

        res.send(errors)
    }
})

// Middlewares para validar parametros de compra
const checkParamsRequestBuy = [
    check("dollarAmount", "Dollar Amount is required or invalid").isFloat().exists(),
    check("currencyName", "Currency Name is required").exists(),
    check("currencyPrice", "Currency Prices is required or invalid").isFloat().exists(),
    check("emailTransaction", "Email transaction is required or invalid").exists(),
    check("manipulationId", "Manipulation ID is required or invalid").exists(),
    check("wallet", "Wallet is required or invalid").exists(),
]

// Api para procesar solicitud de compra
router.post("/buy", checkParamsRequestBuy, async (req, res) => {
    try {

        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { dollarAmount, currencyName, currencyPrice, emailTransaction, manipulationId, wallet } = req.body

        /**
         * 
         * type
            coin_name
            price_coin
            amount_usd
            amount_fraction
            manipulation_id
            email_airtm
            wallet
            hash
         */

        /**Calculamos las fracciones de satochis */
        const grussPice = dollarAmount / currencyPrice

        /**Constante que almacena el precio mas la comision */
        const amount_fraction = currencyName.toLowerCase() === "alycoin" ? dollarAmount : (grussPice - (grussPice * 0.05)).toFixed(8)

        /**Parametros requerido para la consulta en mod `compra` */
        const params = ["buy", currencyName, currencyPrice, dollarAmount, amount_fraction, manipulationId, emailTransaction, wallet, null]

        await sql.run(createMoneyChangerRequest, params)

        // enviamos notificacion socket
        socketAdmin.emit(eventSocketNames.newMoneyChanger)

        res.send({ response: "success" })
    } catch (error) {
        log(`money-changer.controller.js - API Buy - ${error.toString()}`)

        res.send({ error: true, message: error.toString() })
    }
})

const checkParamsRequestSell = [
    check("amount", "Dollar Amount is required or invalid").isFloat().exists(),
    check("currencyName", "Currency Name is required").exists(),
    check("currencyPrice", "Currency Prices is required or invalid").isFloat().exists(),
    check("emailTransaction", "Email transaction is required or invalid").exists(),
    check("hash", "Hash is required or invalid").exists(),
]

// Api para procesar una solicitud de venta
router.post("/sell", checkParamsRequestSell, async (req, res) => {
    try {

        const { amount, currencyName, currencyPrice, emailTransaction, hash } = req.body
        const totalAmount = (currencyPrice * amount)

        // Validamos el hash
        let responseHash = null

        switch (currencyName.toLowerCase()) {
            case "bitcoin":
                responseHash = await bitcoin(hash, amount)


                if (responseHash.error) {
                    throw responseHash.message
                }

                break

            case "ethereum":
                responseHash = await ethereum(hash, amount)


                if (responseHash.error) {
                    throw responseHash.message
                }

                break

            case "dash":
                responseHash = await dash(hash, amount)


                if (responseHash.error) {
                    throw responseHash.message
                }

                break

            case "litecoin":
                responseHash = await litecoin(hash, amount)


                if (responseHash.error) {
                    throw responseHash.message
                }

                break

            case "bitcoin vault":

                break

            default:
                throw "Hash incorrecto, contacte a soporte"
        }

        // Clientes conectados al socket server
        const clients = req.app.get('clients')

        /**Constante que representa el monto a recibir en dolares */
        const amountToReceive = (totalAmount - (totalAmount * 0.05)).toFixed(2)

        /**
         * type
            coin_name
            price_coin
            amount_usd
            amount_fraction
            manipulation_id
            email_airtm
            wallet
            hash
         */
        const params = ["sell", currencyName, currencyPrice, amountToReceive, amount, null, emailTransaction, null, hash]

        await sql.run(createMoneyChangerRequest, params)

        // enviamos notificacion socket
        socketAdmin.emit(eventSocketNames.newMoneyChanger)

        res.send({ response: "success" })

    } catch (error) {
        log(`money-changer.controller.js - API Sell - ${error.toString()}`)

        const errors = {
            error: true,
            message: error.toString()
        }

        res.send(errors)
    }
})

module.exports = router