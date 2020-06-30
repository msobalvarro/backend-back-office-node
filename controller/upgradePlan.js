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
const { planUpgradeRequest, getCurrencyByPlan, searchHash, getDataInformationFromPlanId } = require('./queries')

// import constant
const { WALLETSAPP } = require("../config/constant")

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
    const { amount, id, hash, airtm, emailAirtm, aproximateAmountAirtm } = req.body

    try {
        const errors = validationResult(req)

        // Clientes conectados al socket server
        const clients = req.app.get('clients')

        // Valida si el upgrade es con Airtm
        const existAirtm = airtm === true

        // Comprobamos si hay errores en los parametros de la peticion
        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }


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
                .then((response) => {
                    if (response[0].length > 0) {
                        throw "El hash ya esta registrado"
                    }
                })

            await query.withPromises(getCurrencyByPlan, [id])
                .then(async (response) => {
                    const { currency } = response[0]

                    const comprobate = currency === 1 ? bitcoin : ethereum

                    const { BITCOIN, ETHEREUM } = WALLETSAPP

                    // Obtenemos la direccion wallet
                    const walletFromApp = currency === 1 ? BITCOIN : ETHEREUM

                    // Comprobamos el hash
                    const responseHash = await comprobate(hash, amount, walletFromApp)

                    // Si existe un error de validacion
                    if (responseHash.error) {
                        throw responseHash.message
                    }
                })
        }

        const params = [
            id,
            amount,
            hash,
            existAirtm ? emailAirtm : null,
            existAirtm ? aproximateAmountAirtm : null,
        ]


        query(planUpgradeRequest, params, async () => {
            if (clients !== undefined) {
                // Enviamos la notificacion
                clients.forEach(async (client) => {
                    await client.send("newUpgrade")
                })
            }

            res.status(200).send({ response: 'success' })
        })
    } catch (error) {

        query.withPromises(getDataInformationFromPlanId, [id]).then(response => {
            const infoUser = response[0]

            WriteError(`upgradePlan.js | ${error} (${infoUser.firstname} ${infoUser.lastname} | ${infoUser.phone})`)
        })

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router