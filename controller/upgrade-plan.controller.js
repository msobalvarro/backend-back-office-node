const express = require('express')
const router = express.Router()
const WriteError = require('../logs/write.config')

// MiddleWare
const { auth } = require('../middleware/auth.middleware')
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum, AlyPayTransaction } = require("../middleware/hash.middleware")
const validator = require('validator')

// Mysql
const sql = require('../configuration/sql.config')
const { planUpgradeRequest, getCurrencyByPlan, searchHash, checkStartDateInvestment } = require('../configuration/queries.sql')

// import services
const investmentService = require("../services/investment.service")

// import constants and functions
const { WALLETSAPP, NOW, socketAdmin, eventSocketNames } = require("../configuration/constant.config")
const moment = require("moment")
const _ = require("lodash")

router.get('/', (_, res) => res.status(500))

const checkParamsRequest = [
    auth,
    [
        check('amount', 'amount is required or invalid').isFloat(),
        check('id', 'id is required or invalid').isInt(),
        check('hash', 'Hash is required').exists(),
        check('alypay', 'Unspecified Transaction Type').exists().isBoolean(),
    ]
]

router.post('/', checkParamsRequest, async (req, res) => {
    const { amount, id, hash, airtm, alypay, emailAirtm, aproximateAmountAirtm } = req.body

    try {
        const errors = validationResult(req)

        // Comprobamos si hay errores en los parametros de la peticion
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Valida si el upgrade es con Airtm
        const airtmTransaction = airtm === true

        // obtenemos informacion del plan
        const dataInvestment = await investmentService.getDataInfo(id)

        // Obtenemos las transaccion de ese plan
        const upgradesAlyPay = await investmentService.getLastTransactions(id)

        // verificamos si la transaccion es de alypay
        if (alypay) {
            // obtenemos las transacciones alypay
            const transactionWithAlyPay = _.find(upgradesAlyPay, p => p.transaction.alypay === true)

            // verificamo si el usuario no ha hecho una recarga con alypay con anteriodidad
            if (transactionWithAlyPay !== undefined) {
                throw String("Los Upgrades con alypay es una sola vez al mes")
            }
        }


        // verificamos que si es alypay, puede hacer un upgrade una vez al mes
        // el dia que se registro, será el dia que podrá hacer upgrade
        // if (alypay && moment(dataInvestment.date).get("D") !== moment(NOW()).get("D")) {
        //     throw String(`Puedes hacer upgrade solo los dias ${moment(dataInvestment.date).get("D")} de cada mes`)
        // }

        // Buscamos que el hash/transactionID exista para avisar al usuario
        const responseSearchHash = await sql.run(searchHash, [hash])

        // verificamos si el hash es existente
        if (responseSearchHash[0].length > 0) {
            throw String(airtmTransaction ? "El ID de manipulacion Airtm ya existe" : "El hash ya esta registrado")
        }

        // ejecutamos la consulta para obtener el id de la moneda
        const currency = dataInvestment.coin.id

        // obtenemos las billeteras de la aplicacion
        const { BITCOIN, ETHEREUM, ALYPAY } = WALLETSAPP

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
        } else if (alypay) { // verificamos si la transaccion es de alypa
            // Obtenemos la billetera Speedtradings dependiendo que el plan sea en bitcoin/ethereum
            const walletCompany = (currency === 1) ? ALYPAY.BTCID : ALYPAY.ETHID

            // ejecutamos la validacion de alychain
            const dataResponseAlyValidation = await AlyPayTransaction(hash, amount, walletCompany)

            // validamos si hay un error con el hash alypay
            if (dataResponseAlyValidation.error) {
                throw String(dataResponseAlyValidation.message)
            }

        } else { // esta estructura de validacion es cuando el metodo de pago es deposito
            // Obtenemos el middleware de valdiacion bitcoin/ethereum
            const comprobate = (currency === 1) ? bitcoin : ethereum

            // Obtenemos la direccion wallet
            const walletFromApp = (currency === 1) ? BITCOIN : ETHEREUM

            // Comprobamos el hash
            const responseHash = await comprobate(hash, amount, walletFromApp)

            // Si existe un error de validacion
            if (responseHash.error) {
                throw String(responseHash.message)
            }
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

            // insertamos la hora con la diferencia de horarios
            NOW(),

            // alypay transaction
            alypay === true ? 1 : 0,
        ]

        // ejecutamos la consulta para registrar la solicitud de upgrade
        await sql.run(planUpgradeRequest, params)

        // enviamos notificacion socket
        socketAdmin.emit(eventSocketNames.newUpgrade)

        // si todo va bien, enviamos el success
        res.send({ response: 'success', dataInvestment })
    } catch (error) {
        WriteError(`upgrade-plan.controller.js | ${error} (${req.user.firstname} ${req.user.lastname} | ${req.user.phone}) | ${req.user.email}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router