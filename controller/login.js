const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Crypto = require('crypto-js')
const WriteError = require('../logs/write')
const query = require('../config/query')
const { login } = require('../config/queries')
const { check, validationResult } = require('express-validator')
if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const { JWTSECRET } = process.env

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
        return res.send({
            error: true,
            message: errors.array()[0].msg
        })
    }

    try {
        const { email, password } = req.body

        console.log(email, password)

        query(login, [email, Crypto.SHA256(password, JWTSECRET).toString()], (results) => {
            if (results[0].length > 0) {

                /**Const return data db */
                const result = results[0][0]

                // Verificamos si el usuario ha sido activado
                if (result.enabled === 1) {
                    const playload = {
                        user: result
                    }

                    // Generate Toke user
                    jwt.sign(playload, JWTSECRET, { }, (errSign, token) => {
                            if (errSign) {
                                WriteError(`login.js - error in generate token | ${errSign}`)
                                throw errSign
                            } else {
                                /**Concat new token proprerty to data */
                                const newData = Object.assign(result, { token })

                                return res.status(200).json(newData)
                            }
                        }
                    )
                } else {
                    const response = {
                        error: true,
                        message: 'Esta cuenta no ha sido verificada, revise su correo de activacion.'
                    }

                    res.status(200).send(response)
                }

            }
            else {
                const response = {
                    error: true,
                    message: 'Correo o Contraseña incorrecta'
                }

                res.status(200).send(response)
            }

        })
    } catch (error) {
        /**Error information */
        WriteError(`login.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})


module.exports = router