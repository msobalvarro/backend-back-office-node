const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// MiddleWare
const Auth = require('../middleware/auth')

// Mysql
const query = require('../config/query')
const { createPlan } = require('./queries')

router.get('/', (_, res) => res.status(500))

router.post('/', [
    Auth,
    [
        check('id_currency', 'Currency ID is required or invalid').isInt(),
        check('id_user', 'User ID is required or invalid').isInt(),
        check('hash', 'Hash is required').exists(),
        check('amount', 'Amount is required or Invalid').isNumeric(),
    ]
], (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors)

        return res.status(500).json({
            error: true,
            message: errors.array()[0].msg
        })
    }
    
    try {
        const { id_currency, id_user, hash, amount } = req.body
    
        query(createPlan, [id_currency, id_user, hash, amount], (response) => {
            res.send(response[0][0])
        }).catch(reason => {
            throw reason
        })
    } catch (error) {
        WriteError(`buyPlan.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.status(500).send(response)
    }
})

module.exports = router