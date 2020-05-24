const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../logs/write')
const { bitcoin, ethereum } = require("../middleware/hash")

// MiddleWare
const Auth = require('../middleware/auth')

// Mysql
const query = require('../config/query')
const { planUpgradeRequest, getCurrencyByPlan, searchHash } = require('./queries')

router.get('/', (_, res) => res.status(500))

router.post('/', [
    Auth,
    [
        check('amount', 'amount is required or invalid').isNumeric(),
        check('id', 'id is required or invalid').isInt(),
        check('hash', 'Hash is required').exists(),
    ]
], async (req, res) => {
    const errors = validationResult(req)
    const clients = req.app.get('clients')

    if (!errors.isEmpty()) {
        console.log(errors)

        return res.json({
            error: true,
            message: errors.array()[0].msg
        })
    }

    try {
        const { amount, id, hash } = req.body

        // Buscamos que el hash exista para avisar al usuario
        query(searchHash, [hash], response => {
            if (response[0].length > 0) {
                res.send({
                    error: true,
                    message: "El hash ya esta registrado"
                })
            }
        })

        // Obtenemos que moneda es el plan
        query(getCurrencyByPlan, [id], async (response) => {
            const { currency } = response[0]
            const comprobate = currency === 1 ? bitcoin : ethereum

            // Comprobamos el hash
            const responseHash = await comprobate(hash, amount)

            // Verificamos si hay un error 
            if (responseHash.error) {
                res.send({
                    error: true,
                    message: responseHash.message
                })
            } else {
                query(planUpgradeRequest, [id, amount, hash], async () => {
                    if (clients) {
                        // Enviamos la notificacion
                        clients.forEach(async (client) => {
                            await client.send("newUpgrade")
                        })
                    }

                    res.status(200).send({ response: 'success' })

                }).catch(reason => {
                    throw reason
                })
            }
        })
    } catch (error) {
        WriteError(`upgradePlan.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router