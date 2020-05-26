const express = require('express')
const router = express.Router()
const WriteError = require('../logs/write')

// MiddleWare
const Auth = require('../middleware/auth')
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum } = require("../middleware/hash")
const validator = require('validator')

// Mysql
const query = require('../config/query')
const { planUpgradeRequest, getCurrencyByPlan, searchHash } = require('./queries')

router.get('/', (_, res) => res.status(500))

const checkParamsRequest = [
    Auth,
    [
        check('amount', 'amount is required or invalid').isFloat(),
        check('id', 'id is required or invalid').isInt(),
        check('hash', 'Hash is required').exists(),
    ]
]

router.post('/', checkParamsRequest, async (req, res) => {
    const errors = validationResult(req)
    const clients = req.app.get('clients')

    // Comprobamos si hay errores en los parametros de la peticion
    if (!errors.isEmpty()) {
        console.log(errors)

        return res.send({
            error: true,
            message: errors.array()[0].msg
        })
    }

    try {
        const { amount, id, hash, airtm, emailAirtm, aproximateAmountAirtm } = req.body

        // Valida si el upgrade es con Airtm
        const existAirtm = airtm === true

        // Verificamos si el upgrade es con transaccion Airtm
        if (existAirtm) {
            if (!validator.isEmail(emailAirtm)) {
                res.send({
                    error: true,
                    message: "El correo de transaccion Airtm no es valido"
                })
            }

            if (aproximateAmountAirtm === 0 || aproximateAmountAirtm === undefined) {
                res.send({
                    error: true,
                    message: "El monto de la transaccion no es valido, contacte a soporte"
                })
            }
        } else {
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
            await query(getCurrencyByPlan, [id], async (response) => {
                const { currency } = response[0]
                const comprobate = currency === 1 ? bitcoin : ethereum

                // Comprobamos la existencia del hash
                const responseHash = await comprobate(hash, amount)
                
                // Si existe un error de validacion
                if (responseHash.error) {
                    res.send({
                        error: true,
                        message: responseHash.message
                    })
                }
            })

        }

        const params = [
            id,
            amount,
            hash,
            existAirtm ? emailAirtm : "",
            existAirtm ? aproximateAmountAirtm : 0,
        ]

        query(planUpgradeRequest, params, async () => {
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