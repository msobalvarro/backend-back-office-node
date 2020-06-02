const express = require("express")
const router = express.Router()

// Write log error
const WriteError = require('../logs/write')

// Imports middlewares
const { check, validationResult } = require('express-validator')
const AdminAuth = require("../middleware/authAdmin")

// Import Sql config and query
const query = require("../config/query")
const { createMoneyChangerRequest } = require("./queries")

const checkParamsRequestBuy = [
    check("dollarAmount", "Dollar Amount is required or invalid").isFloat().exists(),
    check("currencyName", "Currency Name is required").exists(),
    check("currencyPrice", "Currency Prices is required or invalid").isFloat().exists(),
    check("emailTransaction", "Email transaction is required or invalid").exists(),
    check("manipulationId", "Manipulation ID is required or invalid").exists(),
    check("wallet", "Wallet is required or invalid").exists(),
]

router.post("/buy", checkParamsRequestBuy, (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw errors.array()[0].msg
        }

        const { dollarAmount, currencyName, currencyPrice, emailTransaction, manipulationId, wallet } = req.body

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

        /**Calculamos las fracciones de satochis */
        const grussPice = dollarAmount / currencyPrice

        /**Constante que almacena el precio mas la comision */
        const amount_fraction = (grussPice - (grussPice * 0.05)).toFixed(8)

        /**Parametros requerido para la consulta en mod `compra` */
        const params = ["buy", currencyName, currencyPrice, dollarAmount, amount_fraction, manipulationId, emailTransaction, wallet, null]

        query.withPromises(createMoneyChangerRequest, params)
            .then(_ => {
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

router.post("/sell", checkParamsRequestSell, (req, res) => {
    try {

        const { amount, currencyName, currencyPrice, emailTransaction, hash } = req.body
        const totalAmount = (currencyPrice * amount)

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
            .then(_ => {
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