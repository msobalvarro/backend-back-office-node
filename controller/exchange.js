const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Logs controller
const WriteError = require('../logs/write')

// mysql
const { createRequestExchange } = require("../controller/queries")
const query = require("../config/query")

const checkAllData = [
    check("currency", "Currency is required").exists(),
    check("hash", "Hash is required").exists(),
    check("amount", "Amount is invalid").exists().isFloat(),
    check("request_currency", "Request currency is required").exists(),
    check("approximate_amount", "Approximate amount is invalid").exists().isFloat(),
    check("wallet", "Wallet is required").exists(),
    check("email", "Email is required").exists().isEmail(),
]


router.get("/", (req, res) => res.status(500))

router.post("/request", checkAllData, (req, res) => {
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


module.exports = router