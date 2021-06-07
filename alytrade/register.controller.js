const express = require('express')
const router = express.Router()

// import constanst and functions
const Crypto = require('crypto-js')
const moment = require('moment')
const validator = require('validator')

const WriteError = require('../../logs/write.config')

// sql configuration
const sql = require('../../configuration/sql.config')
const {
    searchHash,
    getIdByUsername,
    insertWalletAlyPay,
    checkUsernameAndEmailRegister,
} = require('../../configuration/queries.sql')

// import middlewares
const { check, validationResult } = require('express-validator')
const {
    bitcoin,
    ethereum,
    AlyPayTransaction,
    dash,
    litecoin,
    alycoin,
    doge
} = require('../../middleware/hash.middleware')

// import controllers
const { getHTML } = require('../../configuration/html.config')
const sendEmail = require('../../configuration/send-email.config')

// Improt Wallels
const {
    WALLETSAPP,
    ALYHTTP,
    NOW,
    EMAILS,
    minimalInvestmentAlyTrade,
    WALLETS
} = require('../../configuration/constant.config')

// enviroments
const { JWTSECRET } = require('../../configuration/vars.config')

// import services
const { AlypayService } = require('../../services')

const queries = require('./sql')

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
    check('alytradePlan', 'Alytrade Plan is invalid and require').isNumeric().exists(),
    // check('airtm', 'Airtm validation is required').isBoolean(),
]

const getCurrencyMethod = currencyId => {
    switch (currencyId) {
        case 1: //Bitcoin
            return {
                wallet: WALLETSAPP.BITCOIN,
                comprobacion: bitcoin,
                symbol: 'BTC',
                coinName: 'Bitcoin'
            }
        case 2: //Ethereum
            return {
                wallet: WALLETSAPP.ETHEREUM,
                comprobacion: ethereum,
                symbol: 'ETH',
                coinName: 'Ethereum'
            }
        case 3: //Litecoin
            return {
                wallet: WALLETS.LTC,
                comprobacion: litecoin,
                symbol: 'LTC',
                coinName: 'Litecoin'
            }
        case 4: //Dash
            return {
                wallet: WALLETS.DASH,
                comprobacion: dash,
                symbol: 'DASH',
                coinName: 'Dash'
            }
        case 5: //Tether
            return {
                wallet: WALLETS.USDT,
                comprobacion: ethereum,
                symbol: 'USDT',
                coinName: 'Tether'
            }
        case 6: //DogeCoin
            return {
                wallet: WALLETS.DOGE,
                comprobacion: doge,
                symbol: 'DOGE',
                coinName: 'DogeCoin'
            }
        case 7: //Alycoin
            throw "Not implemented"
        case 8: //Ripple
            throw "Not implemented"
        default:
            throw "Currency not found"
    }
}

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
        walletHash,
        amount,
        id_currency,
        id_currency_final,
        info,
        alypay,
        alyWallet,
        alytradePlan
    } = req.body

    try {
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // validamos el monto en bitcoin
        if (id_currency === 1 && amount < minimalInvestmentAlyTrade.BTC) {
            throw String(`El monto minimo de inversión es de ${minimalInvestmentAlyTrade.BTC} BTC`)
        }

        // Validacion de monto en ethereum
        if (id_currency === 2 && amount < minimalInvestmentAlyTrade.ETH) {
            throw String(`El monto minimo de inversión es de ${minimalInvestmentAlyTrade.ETH} ETH`)
        }

        const resultCheck = await sql.run(checkUsernameAndEmailRegister, [
            username,
            email,
        ])

        const currencyObject = getCurrencyMethod(currencyId)


        if (resultCheck.length > 0) {
            throw String('Username or email already exist')
        }


        // verificamos las walles alypay registradas por el usuario
        // donde recibirá sus pagos
        await AlypayService.verifyWallet([
            { wallet: walletHash, symbol: currencyObject.symbol, coinName: currencyObject.coinName },
        ])

        // Ejecutamos consulta para revisar si el hash ya existe en la base de datos
        const responseDataSearchHash = await sql.run(searchHash, [hash])

        // verificamos si el hash existe
        if (responseDataSearchHash[0].length > 0) {
            throw 'El hash ya esta registrado'
        }


        const { comprobacion, wallet } = getCurrencyMethod(id_currency) //id_currency === 1 ? bitcoin : ethereum

        //const { BITCOIN, ETHEREUM } = WALLETSAPP

        // Obtenemos la direccion wallet
        //const walletFromApp = wallet//id_currency === 1 ? BITCOIN : ETHEREUM

        // Verificamos el hash con blockchain
        const responseHash = await comprobacion(hash, amount, wallet)

        if (responseHash.error) {
            throw String(responseHash.message)
        }


        const paramsRegister = [
            firstname,
            lastname,
            email,
            phone,
            country,

            // this param is not required
            //username_sponsor,

            // Register plan
            id_currency,
            amount,
            hash,

            // Information user
            username,
            Crypto.SHA256(password, JWTSECRET).toString(),

            // verificamos si el usuario se registra con wallets alypay
            null,
            null,
            info,

            // Info about airtm
            existAirtm ? emailAirtm : null,
            existAirtm ? aproximateAmountAirtm : null,
            alypay === true ? 1 : 0,
            alytradePlan
        ]

        // ejecutamos la consulta para registar
        await sql.run(queries.ALYTRADE_NEWUSER, paramsRegister)

        /**
         * Se registran las wallets alypay del usuario
         */
        // ejecutamos la busqueda de id del usuario
        const dataSearchUserID = await sql.run(getIdByUsername, [username])

        // obtenemos el id de la consulta
        const { id: id_user } = dataSearchUserID[0]

        // obtenemos los datos para enviar el correo
        const dataEmailConfirm = { time: moment(), username, ip: req.ip }

        // creamos el url encriptado
        const base64 = Buffer.from(JSON.stringify(dataEmailConfirm)).toString(
            'base64'
        )

        // WARNING!!! CHANGE HTTP TO HTTPS IN PRODUCTION
        // const registrationUrl = 'http://ardent-medley-272823.appspot.com/verifyAccount?id=' + base64;
        const registrationUrl = `https://${req.headers.host}/verifyAccount?id=${base64}`

        // obtenemos la plantilla de bienvenida
        const html = await getHTML('welcome.html', {
            name: firstname,
            url: registrationUrl,
        })

        // enviamos el correo de activacion
        await sendEmail({
            from: EMAILS.DASHBOARD,
            to: email,
            subject: 'Activación de Cuenta',
            html,
        })

        // enviamos un response
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
