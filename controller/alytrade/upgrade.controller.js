const express = require('express')
const { check, validationResult } = require('express-validator')
const router = express.Router()
const WriteError = require('../../logs/write.config')
const queries = require('../alytrade/sql')
const {
    bitcoin,
    ethereum,
    AlyPayTransaction,
} = require('../../middleware/hash.middleware')

const {
    searchHash
} = require('../../configuration/queries.sql')

const {
    WALLETSAPP,
    ALYHTTP,
    NOW,
    EMAILS,
    minimalInvestmentAlyTrade
} = require('../../configuration/constant.config')

// sql configuration
const sql = require('../../configuration/sql.config')

const checkArgs = [
    // Validate data params with express validator
    check('hash', 'hash is required').exists(),
    check('amount', 'Amount is invalid and require').isFloat().exists(),
    check('userId', 'userId is invalid and require').isFloat().exists(),
    check('alytradePlan', 'Alytrade Plan is invalid and require').isNumeric.exists(),
]

router.post('/', checkArgs, async (req, res) => {
    const errors = validationResult(req)

    const {
        userId,
        hash,
        emailAirtm,
        airtm,
        aproximateAmountAirtm,
        amount,
        id_currency,
        info,
        alypay,
        alytradePlan
    } = req.body

    let firstname, lastname, email, phone
    console.log(JSON.stringify(req.body, null, 4))
    try {
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Obtener datos del usuario - necesario para el log de error
        const dsUserInfo = await sql.run(queries.ALYTRADE_GETUSERINFO, [userId])
        firstname = dsUserInfo[0].firstname
        lastname = dsUserInfo[0].lastname
        email = dsUserInfo[0].email
        phone = dsUserInfo[0].phone

        // validamos el monto en bitcoin
        if (id_currency === 1 && amount < minimalInvestmentAlyTrade.BTC) {
            throw String(`El monto minimo de inversión es de ${minimalInvestmentAlyTrade.BTC} BTC`)
        }

        // Validacion de monto en ethereum
        if (id_currency === 2 && amount < minimalInvestmentAlyTrade.ETH) {
            throw String(`El monto minimo de inversión es de ${minimalInvestmentAlyTrade.ETH} ETH`)
        }

        // Validacion del wallet
        const comprobate = id_currency === 1 ? bitcoin : ethereum

        const { BITCOIN, ETHEREUM } = WALLETSAPP

        // Obtenemos la direccion wallet
        const walletFromApp = id_currency === 1 ? BITCOIN : ETHEREUM

        // Verificamos el hash con blockchain
        const responseHash = await comprobate(hash, amount, walletFromApp)

        if (responseHash.error) {
            throw String(responseHash.message)
        }

        /* Ejecutamos consulta para revisar si el hash ya existe en la base de datos */
        const responseDataSearchHash = await sql.run(searchHash, [hash])

        // Valida si el registro es con Airtm
        const existAirtm = airtm === true

        // verificamos si el hash existe
        if (responseDataSearchHash[0].length > 0) {
            throw String(
                existAirtm
                    ? 'El id de manipulacion Airtm ya existe'
                    : 'El hash ya esta registrado'
            )
        }

        // Validamos si el registro es con Airtm
        if (existAirtm) {
            if (!validator.isEmail(emailAirtm)) {
                throw String('El correo de transaccion Airtm no es valido')
            }

            if (
                aproximateAmountAirtm === 0 ||
                aproximateAmountAirtm === undefined
            ) {
                throw String(
                    'El monto de la transaccion no es valido, contacte a soporte'
                )
            }
        }

        // Parametros para la funcion de newUserAlytrade,
        const investmentParams = [
            id_currency,
            userId,
            hash,
            amount,
            emailAirtm,
            aproximateAmountAirtm,
            alypay === true ? 1 : 0
        ]

        /* ejecutamos la query para registar el investment */
        await sql.run(queries.ALYTRADE_INSERT_INVESTMENT, investmentParams)

        /* ejecutamos query para ingresar el usuario a la tabla de alytrade */
        await sql.run(queries.ALYTRADE_UPGRADE, [userId])

        /* Ingresamos el plan de Alytrade asociando el investment */
        const investmentDs = await sql.run(queries.ALYTRADE_GET_LASTINVESTMENT_FROM_USER, [userId, id_currency])
        const { id: investmentId } = investmentDs[0]

        await sql.run(queries.ALYTRADE_INSERT_INVESTMENT_PLAN,[investmentId, alytradePlan])
        
        res.send({ response: 'success' })
    } catch (error) {
        /**Error information */
        WriteError(
            `register.controller.js | ${error} (${firstname} ${lastname} | ${email} | ${phone})`
        )

        const response = {
            error: true,
            message: error,
        }

        res.send(response)
    }
})

module.exports = router