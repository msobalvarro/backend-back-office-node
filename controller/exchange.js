const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Auth by token
const auth = require('../middleware/auth')

// Logs controller
const WriteError = require('../logs/write')

// mysql
const { createRequestExchange, getAllExchange } = require("../controller/queries")
const query = require("../config/query")

const checkDataRequest = [
    check("currency", "Currency is required").exists(),
    check("hash", "Hash is required").exists(),
    check("amount", "Amount is invalid").exists().isFloat(),
    check("request_currency", "Request currency is required").exists(),
    check("approximate_amount", "Approximate amount is invalid").exists().isFloat(),
    check("wallet", "Wallet is required").exists(),
    check("email", "Email is required").exists().isEmail(),
]

router.post("/request", checkDataRequest, (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw errors.array()[0].msg
        }

        const { currency, hash, amount, request_currency, approximate_amount, wallet, label, memo, email } = req.body

        query(createRequestExchange, [currency, hash, amount, request_currency, approximate_amount, wallet, label, memo, email], () => {
            res.send({ response: "success" })
        }).catch(reason => {
            throw "ha ocurrido un error en la solicitud"
        })

    } catch (error) {
        console.log(error)
        WriteError(`exchange.js - ${error.toString()}`)

        return res.json({ error: true, message: error.toString() })
    }
})

const checkDataAccept = [auth]

router.get("/", checkDataAccept, (req, res) => {
    try {
        query(getAllExchange, [], (response) => {
            res.send(response)
        })
    } catch (error) {
        WriteError(`exchange.js - ${error.toString()}`)

        return res.json({ error: true, message: error.toString() })
    }
})

module.exports = router