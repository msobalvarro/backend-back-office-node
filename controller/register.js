const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const Crypto = require('crypto-js')
const moment = require('moment')
const validator = require('validator')

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
    // check('airtm', 'Airtm validation is required').isBoolean(),
]

router.post('/', checkArgs, async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors)

        return res.send({
            error: true,
            message: errors.array()[0].msg
        })
    }

    try {
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
        } = req.body

        const comprobate = id_currency === 1 ? bitcoin : ethereum

        // Valida si el registro es con Airtm
        const existAirtm = airtm === true

        // console.log(existAirtm)

        // Validamos si el registro es con Airtm
        if (existAirtm) {
            if (!validator.isEmail(emailAirtm)) {
                res.send({
                    error: true,
                    message: "El correo de transaccion Airtm no es valido"
                })
            }

            if (aproximateAmountAirtm === 0 || aproximateAmountAirtm === undefined) {
                res.send({
                    error: true,
                    message: "El monto de la transaccion no es valido, contacte a soporte"
                })
            }
        } else {
            // Revisamos si el hash ya existe en la base de datos
            await query(searchHash, [hash], async  response => {
                if (response[0].length > 0) {
                    res.send({
                        error: true,
                        message: "El hash ya esta registrado"
                    })
                }
            })

            // Verificamos el hash con blockchain
            const responseHash = await comprobate(hash, amount)


            if (responseHash.error) {
                res.send({
                    error: true,
                    message: responseHash.message
                })
            }
        }

        const params = [
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
            existAirtm ? emailAirtm : "",
            existAirtm ? aproximateAmountAirtm : 0,
        ]

        query(register, params, async (response) => {

            const dataEmailConfirm = { time: moment(), username, ip: req.ip }

            const base64 = Buffer.from(JSON.stringify(dataEmailConfirm)).toString("base64")

            // WARNING!!! CHANGE HTTP TO HTTPS IN PRODUCTION
            const registrationUrl = 'https://' + req.headers.host + '/verifyAccount?id=' + base64;

            await activationEmail(firstname, email, registrationUrl)

            res.status(200).send(response[0][0])
        }).catch(() => {
            throw "No se ha podido ejecutar la consulta de registro"
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