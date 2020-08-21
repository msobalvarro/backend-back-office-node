const express = require('express')
const router = express.Router()
const WriteError = require('../logs/write.config')

// MiddleWare
const { auth } = require('../middleware/auth.middleware')
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum, AlyPayTransaction } = require("../middleware/hash.middleware")
const validator = require('validator')

// Mysql
const query = require('../configuration/query.sql')
const { planUpgradeRequest, getCurrencyByPlan, searchHash, getDataInformationFromPlanId } = require('../configuration/queries.sql')

// import constants and functions
const { WALLETSAPP, ALYHTTP } = require("../configuration/constant.config")
const { takeWhile } = require('lodash')

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
    const { amount, id, hash, airtm, alypay, emailAirtm, aproximateAmountAirtm } = req.body

    console.log(airtm, alypay)

    try {
        const errors = validationResult(req)

        // Clientes conectados al socket server
        const clients = req.app.get('clients')

        // Valida si el upgrade es con Airtm
        const airtmTransaction = airtm === true

        // ejecutamos la consulta para obtener el id de la moneda
        const dataSQLCurrency = await query.withPromises(getCurrencyByPlan, [id])

        // obtenemos las billeteras de la aplicacion
        const { BITCOIN, ETHEREUM, ALYPAY } = WALLETSAPP

        // Comprobamos si hay errores en los parametros de la peticion
        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }

        // Verificamos si el upgrade es con transaccion Airtm
        if (airtmTransaction) {
            // validamos si el correo electroncio Airtm tiene formato correcto
            if (!validator.isEmail(emailAirtm)) {
                throw String("El correo de transaccion Airtm no es valido")
            }

            // validamos el monto de la trasaccion
            if (aproximateAmountAirtm === 0 || aproximateAmountAirtm === undefined) {
                throw String("El monto de la transaccion no es valido, contacte a soporte")
            }
        } else if (alypay) { // verificamos si la transaccion es de alypay
            // obtenemos el id de la moneda seleccionada
            const { currency } = dataSQLCurrency[0]

            // Obtenemos la billetera Speedtradings dependiendo que el plan sea en bitcoin/ethereum
            const walletCompany = currency === 1 ? ALYPAY.BITCOIN : ALYPAY.ETHEREUM

            // ejecutamos la validacion de alychain
            const dataResponseAlyValidation = await AlyPayTransaction(hash, amount, walletCompany)

            // validamos si hay un error con el hash alypay
            if (dataResponseAlyValidation.error) {
                throw String(dataResponseAlyValidation.message)
            }

        } else { // esta estructura de validacion es cuando el metodo de pago es deposito
            // obtenemos el id de la monedqa
            const { currency } = dataSQLCurrency[0]

            // Obtenemos el middleware de valdiacion bitcoin/ethereum
            const comprobate = currency === 1 ? bitcoin : ethereum            

            // Obtenemos la direccion wallet
            const walletFromApp = currency === 1 ? BITCOIN : ETHEREUM

            // Comprobamos el hash
            const responseHash = await comprobate(hash, amount, walletFromApp)

            // Si existe un error de validacion
            if (responseHash.error) {
                throw responseHash.message
            }
        }

        // Buscamos que el hash/transactionID exista para avisar al usuario
        const repsonseSearchHash = await query.withPromises(searchHash, [hash])

        if (repsonseSearchHash[0].length > 0) {
            throw String(airtmTransaction ? "El id de manipulacion Airtm ya existe" : "El hash ya esta registrado")
        }

        // contruimos los datos a guardar a la base de datos
        const params = [
            id,
            amount,
            hash,
            airtmTransaction ? emailAirtm : null,
            airtmTransaction ? aproximateAmountAirtm : null,
            // Approved
            0,
            new Date(),

            // alypay transaction
            alypay === true ? 1 : 0,
        ]

        // ejecutamos la consulta para registrar la solicitud de upgrade
        await query.withPromises(planUpgradeRequest, params)

        // verificamos si hay clientes conectados a websocket
        if (clients !== undefined) {
            // Enviamos la notificacion
            clients.forEach(async (client) => {
                await client.send("newUpgrade")
            })
        }

        // si todo va bien, enviamos el success
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