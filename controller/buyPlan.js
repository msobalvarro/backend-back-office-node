const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../logs/write')

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
        return res.json({
            error: true,
            message: errors.array()[0].msg
        })
    }

    const socket = req.app.get('socket')

    try {
        const { id_currency, id_user, hash, amount } = req.body

        // query(createPlan, [id_currency, id_user, hash, amount], async (response) => {
            if (socket) {
                socket.emit('newRequest')
            }

        //     console.log(socket)

        //     res.send(response[0][0])
        // }).catch(reason => {
        //     throw reason
        // })
    } catch (error) {
        WriteError(`buyPlan.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router