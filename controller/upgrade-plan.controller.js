const express = require('express')
const router = express.Router()
const WriteError = require('../logs/write.config')

// MiddleWare
const { auth } = require('../middleware/auth.middleware')
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum } = require("../middleware/hash.middleware")
const validator = require('validator')

// Mysql
const query = require('../configuration/query.sql')
const { planUpgradeRequest, getCurrencyByPlan, searchHash, getDataInformationFromPlanId } = require('../configuration/queries.sql')

// import constant
const { WALLETSAPP } = require("../configuration/constant.config")

router.get('/', (_, res) => res.status(500))

const checkParamsRequest = [
    auth,
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
            const repsonseSearchHash = await query.withPromises(searchHash, [hash])

            if (repsonseSearchHash[0].length > 0) {
                throw String("El hash ya esta registrado")
            }

            const responseCurrency = await query.withPromises(getCurrencyByPlan, [id])

            // obtenemos el id de la monedqa
            const { currency } = responseCurrency[0]

            // Obtenemos el middleware de valdiacion bitcoin/ethereum
            const comprobate = currency === 1 ? bitcoin : ethereum

            // obtenemos las billeteras de la aplicacion
            const { BITCOIN, ETHEREUM } = WALLETSAPP

            // Obtenemos la direccion wallet
            const walletFromApp = currency === 1 ? BITCOIN : ETHEREUM

            // Comprobamos el hash
            const responseHash = await comprobate(hash, amount, walletFromApp)

            // Si existe un error de validacion
            if (responseHash.error) {
                throw responseHash.message
            }
        }

        const params = [
            id,            
            amount,
            hash,
            existAirtm ? emailAirtm : null,
            existAirtm ? aproximateAmountAirtm : null,
            // Approved
            0,
            new Date(),
        ]

        await query.withPromises(planUpgradeRequest, params)

        if (clients !== undefined) {
            // Enviamos la notificacion
            clients.forEach(async (client) => {
                await client.send("newUpgrade")
            })
        }

        res.status(200).send({ response: 'success' })
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