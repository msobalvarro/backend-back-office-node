const express = require('express')
const router = express.Router()
const _ = require('lodash')
const WriteError = require('../logs/write.config')

// sql configuration
const sql = require('../configuration/sql.config')
const {
    searchHash,
    checkUsernameAndEmailRegister,
} = require('../configuration/queries.sql')

// import middlewares
const { check, validationResult } = require('express-validator')
const {
    bitcoin,
    ethereum,
    AlyPayTransaction,
    dash,
    litecoin,
    alycoin,
    doge,
    binance
} = require('../middleware/hash.middleware')

// import controllers


// Improt Wallels
const {
    WALLETSAPP,
    ALYHTTP,
    NOW,
    EMAILS,
    minimalInvestmentAlyTrade,
    WALLETS
} = require('../configuration/constant.config')

// import services
const { AlypayService } = require('../services')

const queries = require('./sql')

const getCurrencyMethod = currencyId => {
    switch (currencyId) {
        case 1: //Bitcoin
            return {
                id: 1,
                wallet: WALLETSAPP.BITCOIN,
                comprobacion: bitcoin,
                symbol: 'BTC',
                coinName: 'Bitcoin'
            }
        case 2: //Ethereum
            return {
                id: 2,
                wallet: WALLETSAPP.ETHEREUM,
                comprobacion: ethereum,
                symbol: 'ETH',
                coinName: 'Ethereum'
            }
        case 3: //Litecoin
            return {
                id: 3,
                wallet: WALLETS.LTC,
                comprobacion: litecoin,
                symbol: 'LTC',
                coinName: 'Litecoin'
            }
        case 4: //Dash
            return {
                id: 4,
                wallet: WALLETS.DASH,
                comprobacion: dash,
                symbol: 'DASH',
                coinName: 'Dash'
            }
        case 5: //Tether
            return {
                id: 5,
                wallet: WALLETS.USDT,
                comprobacion: ethereum,
                symbol: 'USDT',
                coinName: 'Tether'
            }
        case 6: //DogeCoin
            return {
                id: 6,
                wallet: WALLETS.DOGE,
                comprobacion: doge,
                symbol: 'DOGE',
                coinName: 'DogeCoin'
            }
        case 7: //Alycoin
            throw "Not implemented"
        case 8: //Ripple
            throw "Not implemented"
        case 9: //Binance
            return {
                id: 9,
                wallet: WALLETS.BNB,
                comprobacion: binance,
                symbol: 'BNB',
                coinName: 'Binance'
            }
        default:
            throw "Currency not found"
    }
}
const { mailService, userManagementService, cryptoCurrency } = require('./services')

const checkArgs = [
    // Validate data params with express validator
    check('firstname', 'Name is required').exists(),
    check('lastname', 'Name is required').exists(),
    check('email', 'Please include a valid user name').isEmail(),
    check('phone', 'Mobile phone is required').exists('any'),
    check('country', 'Country is not valid').exists(),

    check('hash', 'hash is required').isString().exists(),
    check('username', 'username is required').isString().exists(),
    check('password', 'Password is required').isString().exists(),
    check('wallet', 'wallet is required').isString().exists(),
    check('amount', 'Amount is invalid and require').isFloat().exists(),
    check('alytradeMonths', 'alytradeMonths Months is requred ').isNumeric().exists()
]
router.post('/register', checkArgs, async (req, res) => {
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
        wallet,
        amount,
        id_currency,
        info,
        alytradeMonths
    } = req.body

    try {
        /** 0. Que no hayan errores en el request **/
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const crypyoToUSDValues = await cryptoCurrency.getUSDCryptoRate()

        // Obtenemos metodos correspondientes al currency
        const currencyObject = getCurrencyMethod(id_currency)
        const amountCrypto = _.floor(minimalInvestmentAlyTrade.USD / crypyoToUSDValues[currencyObject.symbol.toLowerCase()], 2)
        console.log({ amountCrypto, usd: minimalInvestmentAlyTrade.USD, crypyoToUSDValues, symbol: currencyObject.symbol })

        if (!isFinite(amountCrypto) || isNaN(amountCrypto)) {
            throw 'Error al obtener o calcular los montos minimos'
        }

        /** 1. Validacion de montos minimos **/
        if (amount < amountCrypto) {
            throw String(`El monto minimo de inversión es de ${minimalInvestmentAlyTrade.USD} USD ( ${amountCrypto} ${currencyObject.symbol} )`)
        }

        /** 2. Validar que el usuario no exista **/
        const resultCheck = await sql.run(checkUsernameAndEmailRegister, [
            username,
            email,
        ])

        if (resultCheck.length > 0) {
            throw String('Username or email already exist')
        }

        /** 3. Verificamos las wallet alypay registradas por el usuario **/
        await AlypayService.verifyWallet([
            { wallet, symbol: currencyObject.symbol, coinName: currencyObject.coinName },
        ])

        /** 4. Validar que el hash no se haya utilizado anteriormente */
        // Ejecutamos consulta para revisar si el hash ya existe en la base de datos
        const responseDataSearchHash = await sql.run(searchHash, [hash])

        // verificamos si el hash existe
        if (responseDataSearchHash[0].length > 0) {
            throw 'El hash ya esta registrado'
        }

        const { comprobacion, wallet: companyWallet } = getCurrencyMethod(id_currency) //id_currency === 1 ? bitcoin : ethereum

        /** 5. Verificamos el hash con blockchain corresponda a una transaccion con ese monto**/
        const responseHash = await comprobacion(hash, amount, companyWallet)

        if (responseHash.error) {
            throw String(responseHash.message)
        }

        /** 6. Creacion de usuario, investment y plan **/
        const result = await userManagementService.createNewAlytradeAccount({
            months: alytradeMonths, lastname, firstname, id_currency, amount, country, email, hash, months, more_info: info, password, phone, username
        })

        /** 7. Envio de correo de verificacion **/
        await mailService.sendVerficationEmail({
            ip: req.ip, host: req.headers.host, username, firstname, email
        })

        /** 8. Se envia un response de OK */
        res.send({ response: 'success' })
    } catch (error) {
        /** Error information **/
        WriteError(
            `alytrade/register.controller.js | ${error} (${firstname} ${lastname} | ${email} | ${phone})`
        )

        const response = {
            error: true,
            message: error?.message ? error.message : error,
        }

        console.log(error)

        res.send(response)
    }
})

const checkUpgradeArgs = [
    // Validate data params with express validator
    check('hash', 'hash is required').exists(),
    check('amount', 'Amount is invalid and require').isFloat().exists(),
    check('userId', 'userId is invalid and require').isFloat().exists(),
    check('alytradeMonths', 'alytradeMonths is invalid and require').isNumeric().exists(),
]
router.post('/newAlytradeInvestment', checkUpgradeArgs, async (req, res) => {
    const errors = validationResult(req)

    const {
        userId,
        hash,
        wallet,
        amount,
        id_currency,
        alytradeMonths
    } = req.body

    try {
        /** 0. Que no hayan errores en el request **/
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const crypyoToUSDValues = await cryptoCurrency.getUSDCryptoRate()

        // Obtenemos metodos correspondientes al currency
        const currencyObject = getCurrencyMethod(id_currency)
        const amountCrypto = _.floor(minimalInvestmentAlyTrade.USD / crypyoToUSDValues[currencyObject.symbol.toLowerCase()], 2)
        console.log({ amountCrypto, usd: minimalInvestmentAlyTrade.USD, crypyoToUSDValues, symbol: currencyObject.symbol })

        if (!isFinite(amountCrypto) || isNaN(amountCrypto)) {
            throw 'Error al obtener o calcular los montos minimos'
        }

        /** 1. Validacion de montos minimos **/
        if (amount < amountCrypto) {
            throw String(`El monto minimo de inversión es de ${minimalInvestmentAlyTrade.USD} USD ( ${amountCrypto} ${currencyObject.symbol} )`)
        }

        /** 3. Verificamos las wallet alypay registradas por el usuario **/
        await AlypayService.verifyWallet([
            { wallet, symbol: currencyObject.symbol, coinName: currencyObject.coinName },
        ])

        /** 4. Validar que el hash no se haya utilizado anteriormente */
        // Ejecutamos consulta para revisar si el hash ya existe en la base de datos
        const responseDataSearchHash = await sql.run(searchHash, [hash])

        // verificamos si el hash existe
        if (responseDataSearchHash[0].length > 0) {
            throw 'El hash ya esta registrado'
        }

        const { comprobacion, wallet: companyWallet } = getCurrencyMethod(id_currency) //id_currency === 1 ? bitcoin : ethereum

        /** 5. Verificamos el hash con blockchain corresponda a una transaccion con ese monto**/
        const responseHash = await comprobacion(hash, amount, companyWallet)

        if (responseHash.error) {
            throw String(responseHash.message)
        }

        /** 6. Creacion de usuario, investment y plan **/
        const result = await userManagementService.createAlytradeAccount({
            id_currency, hash, amount, months: alytradeMonths, userId
        })

        /** 7. Envio de correo de verificacion **/
        await mailService.sendVerficationEmail({
            ip: req.ip, host: req.headers.host, username, firstname, email
        })

        /** 8. Se envia un response de OK */
        res.send({ response: 'success' })
    } catch (error) {
        /** Error information **/
        WriteError(
            `alytrade/register.controller.js | ${error} (${firstname} ${lastname} | ${email} | ${phone})`
        )

        const response = {
            error: true,
            message: error?.message ? error.message : error,
        }

        console.log(error)

        res.send(response)
    }
})


module.exports = router
