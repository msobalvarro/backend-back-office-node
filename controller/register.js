const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const Crypto = require('crypto-js')
const moment = require('moment')

if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const WriteError = require('../logs/write')
const query = require('../config/query')
const { register, searchHash } = require('./queries')
const { bitcoin, ethereum } = require("../middleware/hash")
const activationEmail = require('./confirm-email')


const { JWTSECRET } = process.env

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
]

router.post('/', checkArgs, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors)

        return res.json({
            error: true,
            message: errors.array()[0].msg
        })
    }

    try {
        const { firstname, lastname, email, phone, country, hash, username, password, walletBTC, walletETH, userCoinbase, username_sponsor, id_currency, amount, info } = req.body

        const comprobate = id_currency === 1 ? bitcoin : ethereum


        query(searchHash, [hash], async  response => {
            if (response[0].length === 0) {
                const response = await comprobate(hash, amount)

                // Verficamos si hay un error en la validacion
                // de hash
                if (response.error) {
                    res.send({
                        error: true,
                        message: response.message
                    })
                } else {
                    query(register, [
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
                        userCoinbase ? userCoinbase : "",
                        info
                    ], async (response) => {

                        const dataEmailConfirm = { time: moment(), username, ip: req.ip }

                        const base64 = Buffer.from(JSON.stringify(dataEmailConfirm)).toString("base64")

                        // WARNING!!! CHANGE HTTP TO HTTPS IN PRODUCTION
                        const registrationUrl = 'https://' + req.headers.host + '/verifyAccount?id=' + base64;

                        await activationEmail(firstname, email, registrationUrl)

                        res.status(200).send(response[0][0])
                    }).catch(() => {
                        throw "No se ha podido ejecutar la consulta de registro"
                    })
                }
            } else {
                res.send({
                    error: true,
                    message: "El hash ya esta registrado"
                })
            }
        })

    } catch (error) {
        /**Error information */
        WriteError(`register.js - catch in register new user | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)

    }
})

module.exports = router