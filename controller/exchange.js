const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Logs controller
const WriteError = require('../logs/write')

// mysql
const query = require("../config/query.js")

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


        res.send("success")
    } catch (error) {
        WriteError(`exchange.js - ${error.toString()}`)

        return res.json({ error: true, message: error.toString() })
    }
})


module.exports = router