const express = require('express')
const router = express.Router()
const WriteError = require('../logs/write')

// MiddleWare
const Auth = require('../middleware/auth')
const validator = require('validator')
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum } = require("../middleware/hash")

// Mysql
const query = require('../config/query')
const { createPlan, searchHash } = require('./queries')

// import constant
const { WALLETSAPP } = require("../config/constant")

router.get('/', (_, res) => res.status(500))

const checkRequestParams = [
    Auth,
    [
        check('id_currency', 'Currency ID is required or invalid').isInt(),
        check('id_user', 'User ID is required or invalid').isInt(),
        check('hash', 'Hash is required').exists(),
        check('amount', 'Amount is required or Invalid').isNumeric(),
    ]
]

router.post('/', checkRequestParams, async (req, res) => {
    try {
        const clients = req.app.get('clients')
        const errors = validationResult(req)
        const { id_currency, id_user, hash, amount, airtm, emailAirtm, aproximateAmountAirtm } = req.body
        const existAirtm = airtm === true

        if (!errors.isEmpty()) {
            throw errors.array()[0].msg
        }

        // Valida si el upgrade es con Airtm

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
            await query.withPromises(searchHash, [hash])
                .then(response => {
                    if (response[0].length > 0) {
                        throw "El hash ya esta registrado"
                    }
                })

            const comprobate = id_currency === 1 ? bitcoin : ethereum

            const { BITCOIN, ETHEREUM } = WALLETSAPP

            // Obtenemos la direccion wallet
            const walletFromApp = id_currency === 1 ? BITCOIN : ETHEREUM

            // Comprobamos el hash
            const responseHash = await comprobate(hash, amount, walletFromApp)

            // Verificamos si hay un error 
            if (responseHash.error) {
                throw responseHash.message
            }
        }

        const params = [
            id_currency,
            id_user,
            hash,
            amount,

            // Info about airtm
            existAirtm ? emailAirtm : null,
            existAirtm ? aproximateAmountAirtm : null,
        ]

        // Creamos la solicitud
        query(createPlan, params, async (response) => {
            if (clients !== undefined) {
                clients.forEach(async (client) => {
                    await client.send("newRequest")
                })
            }

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

        res.send(response)
    }
})

module.exports = router