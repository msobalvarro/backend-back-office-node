const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Crypto = require('crypto-js')
const log = require('../logs/write.config')
const sql = require('../configuration/sql.config')
const { login } = require('../configuration/queries.sql')
const { check, validationResult } = require('express-validator')
const { NOW } = require("../configuration/constant.config")

const { JWTSECRETSIGN, JWTSECRET } = require("../configuration/vars.config")

/**Metodo que genera token */
const SignIn = (playload = {}) => new Promise((resolve, reject) => {
    try {
        // Generate Toke user
        jwt.sign(playload, JWTSECRETSIGN, {}, (errSign, token) => {
            // verificamos si hay un error de token
            if (errSign) {
                throw String(errSign.message)
            }


            resolve(token)
        })
    } catch (error) {
        reject(error)
    }
})

const validationParams = [
    // Validate data params with express validator
    check('email', 'Please include a valid user email').isEmail(),
    check('password', 'Password is required').exists(),
]

router.post('/', validationParams, async (req, res) => {
    try {
        const errors = validationResult(req)

        // validamos el error de los paramtros
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { email, password, web } = req.body

        const results = await sql.run(login, [email, Crypto.SHA256(password, JWTSECRET).toString()])

        // Validamos si existe el usuario
        if (results[0].length === 0) {
            throw String("Correo o Contraseña incorrecta")
        }

        /**Const return data db */
        const result = results[0][0]

        // Verificamos si el usuario ha sido activado
        if (result.enabled === 0) {
            throw String("Esta cuenta no ha sido verificada, revise su correo de activacion")
        }

        // verificamos si tiene KYC
        if (result.kyc_type === null && !web) {
            throw String("Completar Registro de KYC en la web")
        }

        // generamos los datos a guardar el token
        const playload = {
            user: result,
            update: NOW()
        }

        // generamos el token
        const token = await SignIn(playload)

        // enviamos los datos de informacion
        res.send({ ...result, token })

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