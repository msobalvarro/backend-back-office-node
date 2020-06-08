const express = require("express")
const router = express.Router()

// Write log error
const WriteError = require('../logs/write')

// Imports middlewares
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum, dash, litecoin } = require("../middleware/hash")
const AdminAuth = require("../middleware/authAdmin")

// Import Sql config and query
const query = require("../config/query")
const { createMoneyChangerRequest, getMoneyChangerRequest, setInactiveChangeRequest } = require("./queries")

// Import HTML Response
// const HTMLAccept = require("../templates/accept-money-changer.html")

// Imports SendEmail Function
const sendEmail = require("../config/sendEmail")

// Import HTML Template Function
const { getHTML } = require("../config/html")

// Api para obtener todas las solicitudes
router.get("/", AdminAuth, (req, res) => {
    try {
        query.withPromises(getMoneyChangerRequest)
            .then(response => {
                res.send(response)
            })
            .catch(reason => {
                throw reason.toString()
            })
    } catch (error) {
        WriteError(`money-changer.js - API get all request - ${error.toString()}`)
    }
})

const checkParamsRequestAccept = [
    AdminAuth,
    [
        check("request", "Data request is require").isJSON().exists(),
    ]
]

router.post("/accept", async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw errors.array()[0].msg
        }


        const html = await getHTML("accept-money-changer.html", { reason: "TEST DE PRUEBA" })

        res.send({ html })


    } catch (error) {
        WriteError(`money-changer.js - Accept Request - ${error.toString()}`)

        const errors = {
            error: true,
            message: error.toString()
        }

        res.send(errors)
    }
})

const checkParamsRequestBuy = [
    check("dollarAmount", "Dollar Amount is required or invalid").isFloat().exists(),
    check("currencyName", "Currency Name is required").exists(),
    check("currencyPrice", "Currency Prices is required or invalid").isFloat().exists(),
    check("emailTransaction", "Email transaction is required or invalid").exists(),
    check("manipulationId", "Manipulation ID is required or invalid").exists(),
    check("wallet", "Wallet is required or invalid").exists(),
]

// Api para procesar solicitud de compra
router.post("/buy", checkParamsRequestBuy, (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw errors.array()[0].msg
        }

        // Clientes conectados al socket server
        const clients = req.app.get('clients')

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
        const amount_fraction = (grussPice - (grussPice * 0.05)).toFixed(8)

        /**Parametros requerido para la consulta en mod `compra` */
        const params = ["buy", currencyName, currencyPrice, dollarAmount, amount_fraction, manipulationId, emailTransaction, wallet, null]

        query.withPromises(createMoneyChangerRequest, params)
            .then(async _ => {
                if (clients !== undefined) {
                    // Enviamos la notificacion
                    await clients.forEach(async (client) => {
                        await client.send("newMoneyChanger")
                    })
                }

                res.send({ response: "success" })
            })
            .catch(reason => {
                new Error(reason)
            })
    } catch (error) {
        WriteError(`money-changer.js - API Buy - ${error.toString()}`)


        const errors = {
            error: true,
            message: error.toString()
        }

        res.send(errors)
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

        if (currencyName.toLowerCase() === "bitcoin") {
            // Verificamos el hash con blockchain
            const responseHash = await bitcoin(hash, amount)


            if (responseHash.error) {
                throw responseHash.message
            }
        } else if (currencyName.toLowerCase() === "ethereum") {
            // Verificamos el hash con blockchain
            const responseHash = await ethereum(hash, amount)


            if (responseHash.error) {
                throw responseHash.message
            }
        } else if (currencyName.toLowerCase() === "dash") {
            // Verificamos el hash con blockchain
            const responseHash = await dash(hash, amount)


            if (responseHash.error) {
                throw responseHash.message
            }
        } else if (currencyName.toLowerCase() === "litecoin") {
            // Verificamos el hash con blockchain
            const responseHash = await litecoin(hash, amount)


            if (responseHash.error) {
                throw responseHash.message
            }
        } else {
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

        query.withPromises(createMoneyChangerRequest, params)
            .then(async _ => {
                if (clients !== undefined) {
                    // Enviamos la notificacion
                    await clients.forEach(async (client) => {
                        await client.send("newMoneyChanger")
                    })
                }

                res.send({ response: "success" })
            })
            .catch(reason => {
                new Error(reason)
            })

    } catch (error) {
        WriteError(`money-changer.js - API Sell - ${error.toString()}`)

        const errors = {
            error: true,
            message: error.toString()
        }

        res.send(errors)
    }
})

module.exports = router