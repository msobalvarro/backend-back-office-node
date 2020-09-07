const express = require('express')
const router = express.Router()

// import constanst and functions
const Crypto = require('crypto-js')
const moment = require('moment')
const validator = require('validator')

const WriteError = require('../logs/write.config')

// sql configuration
const query = require('../configuration/sql.config')
const { register, searchHash, getIdByUsername, insertWalletAlyPay } = require('../configuration/queries.sql')

// import middlewares
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum, AlyPayTransaction } = require("../middleware/hash.middleware")

// import controllers
const activationEmail = require('./confirm-email.controller')


// Improt Wallels 
const { WALLETSAPP, ALYHTTP } = require("../configuration/constant.config")

// enviroments
const { JWTSECRET } = require("../configuration/vars.config")

router.get('/', (_, res) => {
    res.send('Server Error')
})

const checkArgs = [
    // Validate data params with express validator
    check('firstname', 'Name is required').exists(),
    check('lastname', 'Name is required').exists(),
    check('email', 'Please include a valid user name').isEmail(),
    check('phone', 'Mobile phone is required').exists('any'),
    check('country', 'Country is not valid').exists(),

    check('hash', 'hash is required').exists(),
    check('username', 'username is required').exists(),
    check('password', 'Password is required').exists(),
    check('walletBTC', 'wallet in Bitcoin is required').exists(),
    check('walletETH', 'wallet in Ethereum is required').exists(),
    check('amount', 'Amount is invalid and require').isFloat().exists(),
    // check('airtm', 'Airtm validation is required').isBoolean(),
]

router.post('/', checkArgs, async (req, res) => {
    const errors = validationResult(req)

    const {
        firstname,
        lastname,
        email,
        phone,
        country,
        hash,
        username,
        password,
        walletBTC,
        walletETH,
        emailAirtm,
        airtm,
        aproximateAmountAirtm,
        amount,
        id_currency,
        username_sponsor,
        info,
        alypay,
        alyWallet,
    } = req.body

    try {
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Valida si el registro es con Airtm
        const existAirtm = airtm === true

        // creamos constante donde nos diga si el usuario quiere recibir pagos con alypay
        const payWithAlypay = (alypay || alyWallet)

        // verificamos si el usuario se registra con walletsalypay 
        if (payWithAlypay) {
            // ejecutamos una peticion a la api para verificar cartera del cliente en Bitcoin
            const { data: dataResponseBTC } = await ALYHTTP.get(`/blockchain/wallet/${walletBTC}`)

            // verificamos si hay algun error con la cartera en bitcoin
            if (dataResponseBTC.error) {
                throw String("Billetera AlyPay Bitcoin no encontrada")
            } else if (dataResponseBTC.symbol !== "BTC") { // verificamos que la cartera sea de la misma moneda
                throw String("Billetera AlyPay Bitcoin no es correcta")
            }

            // ejecutamos una peticion a la api para verificar cartera del cliente en Ethereum
            const { data: dataResponseETH } = await ALYHTTP.get(`/blockchain/wallet/${walletETH}`)

            // verificamos si hay algun error con la cartera en bitcoin
            if (dataResponseETH.error) {
                throw String("Billetera AlyPay Ethereum no encontrada")
            } else if (dataResponseETH.symbol !== "ETH") { // verificamos que la cartera sea de la misma moneda
                throw String("Billetera AlyPay Ethereum no es correcta")
            }
        }

        // Ejecutamos consulta para revisar si el hash ya existe en la base de datos
        const responseDataSearchHash = await query.run(searchHash, [hash])

        // verificamos si el hash existe
        if (responseDataSearchHash[0].length > 0) {
            throw String(existAirtm ? "El id de manipulacion Airtm ya existe" : "El hash ya esta registrado")
        }

        // Validamos si el registro es con Airtm
        if (existAirtm) {
            if (!validator.isEmail(emailAirtm)) {
                throw String("El correo de transaccion Airtm no es valido")
            }

            if (aproximateAmountAirtm === 0 || aproximateAmountAirtm === undefined) {
                throw String("El monto de la transaccion no es valido, contacte a soporte")
            }
        } else if (alypay) {
            const walletCompany = id_currency === 1 ? WALLETSAPP.ALYPAY.BTCID : WALLETSAPP.ALYPAY.ETHID

            // ejecutamos la validacion de alychain
            const dataResponseAlyValidation = await AlyPayTransaction(hash, amount, walletCompany)

            // validamos si hay un error con el hash alypay
            if (dataResponseAlyValidation.error) {
                throw String(dataResponseAlyValidation.message)
            }

        } else {
            const comprobate = id_currency === 1 ? bitcoin : ethereum

            const { BITCOIN, ETHEREUM } = WALLETSAPP

            // Obtenemos la direccion wallet
            const walletFromApp = id_currency === 1 ? BITCOIN : ETHEREUM

            // Verificamos el hash con blockchain
            const responseHash = await comprobate(hash, amount, walletFromApp)

            if (responseHash.error) {
                throw String(responseHash.message)
            }
        }

        const paramsRegister = [
            firstname,
            lastname,
            email,
            phone,
            country,

            // this param is not required
            username_sponsor,

            // Register plan
            id_currency,
            amount,
            hash,

            // Information user
            username,
            Crypto.SHA256(password, JWTSECRET).toString(),

            // verificamos si el usuario se registra con wallets alypay
            payWithAlypay ? null : walletBTC,
            payWithAlypay ? null : walletETH,
            info,

            // Info about airtm
            existAirtm ? emailAirtm : null,
            existAirtm ? aproximateAmountAirtm : null,
            (alypay === true) ? 1 : 0,
        ]

        // ejecutamos la consulta para registar
        const responseRegister = await query.run(register, paramsRegister)

        console.log(responseRegister)

        // verificamos si el usuario quiere recibir pagos alypay
        if (payWithAlypay) {
            // ejecutamos la busqueda de id del usuario
            const dataSearchUserID = await query.run(getIdByUsername, [username])

            // obtenemos el id de la consulta
            const { id: id_user } = dataSearchUserID[0]

            // guardamos los datos que se guardaran
            const paramsAlyWalletInsertion = [
                // id del usuario
                id_user,

                // billeteras alypay
                walletBTC,
                walletETH,

                // fecha de creacion
                new Date(),

                // estado (POR DEFECTO 1)
                1
            ]

            //ejecutamos la query de insersion
            await query.run(insertWalletAlyPay, paramsAlyWalletInsertion)
        }

        // obtenemos los datos para enviar el correo
        const dataEmailConfirm = { time: moment(), username, ip: req.ip }

        // creamos el url encriptado
        const base64 = Buffer.from(JSON.stringify(dataEmailConfirm)).toString("base64")

        // WARNING!!! CHANGE HTTP TO HTTPS IN PRODUCTION
        // const registrationUrl = 'http://ardent-medley-272823.appspot.com/verifyAccount?id=' + base64;
        const registrationUrl = 'https://' + req.headers.host + '/verifyAccount?id=' + base64;

        // enviamos el correo de activacion
        await activationEmail(firstname, email, registrationUrl)

        // enviamos un response
        res.send({ response: "success" })
    } catch (error) {
        /**Error information */
        WriteError(`register.controller.js | ${error} (${firstname} ${lastname} | ${email} | ${phone})`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router