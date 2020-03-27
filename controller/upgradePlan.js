const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../logs/write')

// MiddleWare
const Auth = require('../middleware/auth')

// Mysql
const query = require('../config/query')
const { planUpgradeRequest } = require('./queries')

router.get('/', (_, res) => res.status(500))

router.post('/', [
    Auth,
    [
        check('amount', 'amount is required or invalid').isNumeric(),
        check('id', 'id is required or invalid').isInt(),
        check('hash', 'Hash is required').exists(),
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
        const { amount, id, hash} = req.body
    
        // HEREEEEE
        query(planUpgradeRequest, [id, amount, hash], (response) => {
            res.status(200).send({ response: 'success' })
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