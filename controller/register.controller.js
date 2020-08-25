const express = require('express')
const router = express.Router()

// import constanst and functions
const Crypto = require('crypto-js')
const moment = require('moment')
const validator = require('validator')

const WriteError = require('../logs/write.config')

// sql configuration
const query = require('../configuration/query.sql')
const { register, searchHash } = require('../configuration/queries.sql')

// import middlewares
const { check, validationResult } = require('express-validator')
const { bitcoin, ethereum, AlyPayTransaction } = require("../middleware/hash.middleware")

// import controllers
const activationEmail = require('./confirm-email.controller')


// Improt Wallels 
const { WALLETSAPP } = require("../configuration/constant.config")

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
        alypay
    } = req.body
    
    try {
        
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Valida si el registro es con Airtm
        const existAirtm = airtm === true

        // Revisamos si el hash ya existe en la base de datos
        // const responseDataSearchHash = await query.withPromises(searchHash, [hash])

        // if (responseDataSearchHash[0].length > 0) {
        //     throw String(existAirtm ? "El id de manipulacion Airtm ya existe" : "El hash ya esta registrado")
        // }

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

            console.log(amount)

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
            walletBTC,
            walletETH,
            info,

            // Info about airtm
            existAirtm ? emailAirtm : null,
            existAirtm ? aproximateAmountAirtm : null,
            (alypay === true) ? 1 : 0,
        ]

        // ejecutamos la consulta para registar
        // const responseRegister = await query.withPromises(register, paramsRegister)

        if (!responseRegister[0][0].response) {
            throw String("No hemos podido procesar tu cuenta, contacte a soporte")
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