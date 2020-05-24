const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum } = require("../middleware/hash")
const WriteError = require('../logs/write')

// MiddleWare
const Auth = require('../middleware/auth')

// Mysql
const query = require('../config/query')
const { createPlan, searchHash } = require('./queries')

router.get('/', (_, res) => res.status(500))

router.post('/', [
    Auth,
    [
        check('id_currency', 'Currency ID is required or invalid').isInt(),
        check('id_user', 'User ID is required or invalid').isInt(),
        check('hash', 'Hash is required').exists(),
        check('amount', 'Amount is required or Invalid').isNumeric(),
    ]
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.json({
            error: true,
            message: errors.array()[0].msg
        })
    }

    const clients = req.app.get('clients')

    try {
        const { id_currency, id_user, hash, amount } = req.body

        // Buscamos que el hash exista para avisar al usuario
        query(searchHash, [hash], response => {
            if (response[0].length > 0) {
                res.send({
                    error: true,
                    message: "El hash ya esta registrado"
                })
            }
        })

        const comprobate = id_currency === 1 ? bitcoin : ethereum

        // Comprobamos el hash
        const responseHash = await comprobate(hash, amount)

        // Verificamos si hay un error 
        if (responseHash.error) {
            res.send({
                error: true,
                message: responseHash.message
            })
        } else {
            // Creamos la solicitud
            query(createPlan, [id_currency, id_user, hash, amount], async (response) => {
                if (clients) {
                    clients.forEach(async (client) => {
                        await client.send("newRequest")
                    })
                }

                res.send(response[0][0])
            }).catch(reason => {
                throw reason
            })
        }

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