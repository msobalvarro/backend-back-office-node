const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const Crypto = require('crypto-js')
const axios = require("axios")
const moment = require('moment')

if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const WriteError = require('../logs/write')
const query = require('../config/query')
const { register } = require('./queries')

const activationEmail = require('./confirm-email')


const { JWTSECRET } = process.env

router.get('/', (_, res) => {
    res.send('Server Error')
})

router.post('/', [
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
    check('walletETH', 'wallet in Ethereum is required').exists()
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors)

        return res.json({
            error: true,
            message: errors.array()[0].msg
        })
    }

    try {
        const { firstname, lastname, email, phone, country, hash, username, password, walletBTC, walletETH, username_sponsor, id_currency, amount, info } = req.body

        const url = `https://api.blockcypher.com/v1/${id_currency === 1 ? 'btc' : 'eth'}/main/txs/${hash}`

        // console.log(firstname, lastname, email, phone, country, hash, username, password, walletBTC, walletETH, username_sponsor, id_currency, amount, info)

        await axios.get(url).then( ({ data, status }) => {
            // Verificamos si hay un error de transaccional
            // Hasta este punto verificamos si el hash es valido
            if (data.error) {
                new "El hash de transaccion no fue encontrada"
            } else {

                // Verificamos si la transaccion la hicieron hace poco
                // El hash debe ser reciente (dentro de las 12 horas)
                if (moment().diff(data.confirmed, "hours") <= 12) {
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
                        info
                    ], async (response) => {

                        const dataEmailConfirm = { time: moment(), username, ip: req.ip }

                        const base64 = Buffer.from(JSON.stringify(dataEmailConfirm)).toString("base64")
                        
                        // WARNING!!! CHANGE HTTP TO HTTPS IN PRODCUTION
                        const registrationUrl = 'https://' + req.headers.host + '/verifyAccount?id=' + base64;

                        await activationEmail(firstname, email, registrationUrl)

                        res.status(200).send(response[0][0])
                    }).catch(reason => {
                        throw "No se ha podido ejecutar la consulta de registro"
                    })
                } else {
                    throw "El hash de transaccion no es actual, contacte a soporte"
                }
            }
        }).catch((reason) => {
            if (typeof reason === "string") {
                throw reason
            } 

            if (typeof reason === "object") {
                throw "El hash de transaccion no fue encontrada"
            }
        })

    } catch (error) {
        /**Error information */
        WriteError(`register.js - catch in register new user | ${error}`)

        if (typeof error === "object") {
            const response = {
                error: true,
                message: error.message
            }

            res.send(response)
        } else {
            const response = {
                error: true,
                message: error
            }

            res.status(200).send(response)
        }

    }
})

module.exports = router