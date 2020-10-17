const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Crypto = require('crypto-js')
const log = require('../logs/write.config')
const sql = require('../configuration/sql.config')
const { login } = require('../configuration/queries.sql')
const { check, validationResult } = require('express-validator')

const { JWTSECRETSIGN, JWTSECRET } = require("../configuration/vars.config")

router.get('/', (_, res) => {
    res.send('Server Error')
})

router.post('/', [
    // Validate data params with express validator
    check('email', 'Please include a valid user email').isEmail(),
    check('password', 'Password is required').exists(),
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        throw String(errors.array()[0].msg)
    }

    try {
        const { email, password } = req.body

        const results = await sql.run(login, [email, Crypto.SHA256(password, JWTSECRET).toString()])

        if (results[0].length > 0) {

            /**Const return data db */
            const result = results[0][0]

            // Verificamos si el usuario ha sido activado
            if (result.enabled === 1) {
                const playload = {
                    user: result
                }

                // Generate Toke user
                jwt.sign(playload, JWTSECRETSIGN, {}, (errSign, token) => {
                    if (errSign) {
                        log(`login.js - error in generate token | ${errSign}`)
                        throw String(errSign.message)
                    } else {
                        /**Concat new token proprerty to data */
                        const newData = Object.assign(result, { token })

                        return res.status(200).json(newData)
                    }
                }
                )
            } else {
                throw String("Esta cuenta no ha sido verificada, revise su correo de activacion")
            }

        }
        else {
            throw String("Correo o Contraseña incorrecta")
        }
    } catch (error) {
        /**Error information */
        log(`login.controller.js | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})


module.exports = router