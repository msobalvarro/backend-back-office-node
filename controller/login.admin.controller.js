const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Crypto = require('crypto-js')
const WriteError = require('../logs/write.config')
const { check, validationResult } = require('express-validator')

// SQl queries
const query = require('../configuration/query.sql')
const { loginAdmin } = require('../configuration/queries.sql')

const { JWTSECRET } = require("../configuration/vars.config")

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

        // res.send([email, Crypto.SHA256(password, JWTSECRET).toString()])

        const results = await query.run(loginAdmin, [email, Crypto.SHA256(password, JWTSECRET).toString()])

        if (results[0].length > 0) {
            /**Const return data db */
            const result = results[0][0]


            const playload = {
                user: result,
                root: true,
            }

            // Generate Toke user
            jwt.sign(playload, JWTSECRET, {}, (errSign, token) => {
                if (errSign) {
                    throw String(errSign)
                } else {
                    /**Concat new token proprerty to data */
                    const newData = Object.assign(result, { token })

                    return res.status(200).json(newData)
                }
            })
        }
        else {
            throw String("Email or password is incorrect")
        }
    } catch (error) {
        /**Error information */
        WriteError(`login.admin.controller.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})


module.exports = router