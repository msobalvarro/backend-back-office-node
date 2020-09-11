const express = require('express')
const router = express.Router()
const WriteError = require('../logs/write.config')

// MiddleWare
const { auth } = require('../middleware/auth.middleware')
const validator = require('validator')
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum, AlyPayTransaction } = require("../middleware/hash.middleware")

// Mysql
const sql = require('../configuration/sql.config')
const { createPlan, searchHash } = require('../configuration/queries.sql')

// import constant
const { WALLETSAPP } = require("../configuration/constant.config")

router.get('/', (_, res) => res.status(500))

const checkRequestParams = [
    auth,
    [
        check('id_currency', 'Currency ID is required or invalid').isInt(),
        check('id_user', 'User ID is required or invalid').isInt(),
        check('hash', 'Hash is required').isString().exists(),
        check('amount', 'Amount is required or Invalid').isFloat().exists(),
    ]
]

router.post('/', checkRequestParams, async (req, res) => {
    const { id_currency, hash, amount, airtm, emailAirtm, aproximateAmountAirtm, alypay } = req.body

    const { id_user } = req.user

    try {
        const clients = req.app.get('clients')
        const errors = validationResult(req)
        const existAirtm = airtm === true

        if (!errors.isEmpty()) {
            throw errors.array()[0].msg
        }

        // Buscamos que el hash exista para avisar al usuario
        const responseSearchHash = await sql.run(searchHash, [hash])

        // Verificamos si el hash o el id de airtm
        if (responseSearchHash[0].length > 0) {
            throw String(airtm ? "El ID de manipulacion ya esta registrado, contacte a soporte" : "El hash ya esta registrado, contacte a soporte")
        }

        // obtenemos las billeteras de la aplicacion
        const { BITCOIN, ETHEREUM, ALYPAY } = WALLETSAPP

        // Valida si el upgrade es con Airtm
        // Verificamos si el upgrade es con transaccion Airtm
        if (existAirtm) {
            if (!validator.isEmail(emailAirtm)) {
                throw String("El correo de transaccion Airtm no es valido")
            }

            if (aproximateAmountAirtm === 0 || aproximateAmountAirtm === undefined) {
                throw String("El monto de la transaccion no es valido, contacte a soporte")
            }
        } else if (alypay) {
            // Obtenemos la billetera Speedtradings dependiendo que el plan sea en bitcoin/ethereum
            const walletCompany = id_currency === 1 ? ALYPAY.BTCID : ALYPAY.ETHID

            // ejecutamos la validacion de alychain
            const dataResponseAlyValidation = await AlyPayTransaction(hash, amount, walletCompany)

            // validamos si hay un error con el hash alypay
            if (dataResponseAlyValidation.error) {
                throw String(dataResponseAlyValidation.message)
            }
        } else {
            // Verificamos si la comprobacion de hash es btc/eth
            const comprobate = id_currency === 1 ? bitcoin : ethereum

            // Obtenemos la direccion wallet
            const walletFromApp = id_currency === 1 ? BITCOIN : ETHEREUM

            // Comprobamos el hash
            const responseHash = await comprobate(hash, amount, walletFromApp)

            // Verificamos si hay un error 
            if (responseHash.error) {
                throw String(responseHash.message)
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
            alypay === true ? 1 : 0
        ]

        // Creamos la solicitud
        const responseCreatePlan = await sql.run(createPlan, params)

        if (responseCreatePlan[0][0].response !== "success") {
            throw String("Tu compra no se ha podido ejecutar, contacte a soporte")
        }

        if (clients !== undefined) {
            clients.forEach(async (client) => {
                await client.send("newRequest")
            })
        }

        res.send({ response: "success" })
    } catch (error) {
        WriteError(`buyPlan.js | ${error} (ID:USER ${id_user})`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router