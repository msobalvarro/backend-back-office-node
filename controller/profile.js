const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const Crypto = require('crypto-js')
const WriteError = require('../logs/write')
const Auth = require('../middleware/auth')
if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const { JWTSECRET } = process.env

// Imports mysql config
const { updateWallets, login, getInfoProfile } = require('./queries')
const query = require('../config/query')

const checkValidation = [
    Auth,
    [
        check("id_user", "id_user is required").exists().isInt(),
        check("btc", "Wallet en BTC es requerido").exists(),
        check("eth", "Wallet en ETH es requerido").exists(),
        // check("username", "Coinbase username is required").exists(),
        check("password", "password is required").exists(),
        check("email", "email is requerid").exists(),
    ]
]

router.post('/update-wallet', checkValidation, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id_user, btc, eth, password, email } = req.body

        query(updateWallets, [btc, eth, id_user], () => {
            query(login, [email, Crypto.SHA256(password, JWTSECRET).toString()], (results) => {
                if (results[0].length > 0) {
                    const token = req.header('x-auth-token')

                    /**Const return data db */
                    const result = Object.assign(results[0][0], { token })

                    res.send(result)
                }
                else {
                    const response = {
                        error: true,
                        message: 'Tu Contraseña es incorrecta'
                    }

                    res.status(200).send(response)
                }
            })
        })
    } catch (error) {
        /**Error information */
        WriteError(`profile.js - catch | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

router.get('/info', Auth, (req, res) => {
    try {
        const { id } = req.query

        if (id) {
            query(getInfoProfile, [id], (response) => {
                res.send(response[0][0])
            })
        } else {
            throw "El parametro ID es requerido"
        }

    } catch (error) {
        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router