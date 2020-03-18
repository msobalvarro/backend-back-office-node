const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const WriteError = require('../logs/write')
const query = require('../config/query')
const queries = require('./queries')
const { check, validationResult } = require('express-validator')
require('dotenv').config()

const { JWTSECRET } = process.env

router.get('/', (req, res) => {
    res.status(500).send('Server Error')
})

router.post('/', [
    // Validate data params with express validator
    check('email', 'Please include a valid user name').isEmail(),
    check('password', 'Password is required').exists(),
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(401).json({
            error: true,
            message: errors.array()[0].msg
        })
    }


    try {
        const { email, password } = req.body

        query(queries.login, [email, password], (results) => {
            if (results[0].length > 0) {
                /**Const return data db */
                const result = results[0][0]

                /**Const return data user */
                const data = {
                    name: `${result.FirstName} ${result.LastName}`,
                    username: result.User,
                }

                const playload = {
                    user: data
                }

                // Generate Toke user
                jwt.sign(
                    playload,
                    JWTSECRET,
                    {
                        expiresIn: 36000
                    },
                    (errSign, token) => {
                        if (errSign) {
                            WriteError(`login.js - error in generate token | ${errSign}`)
                            throw errSign
                        } else {
                            /**Concat new token proprerty to data */
                            const newData = Object.assign(data, { token })

                            return res.status(200).json(newData)
                        }
                    }
                )
            }
            else {
                const response = {
                    error: true,
                    message: 'Email or password is incorrect'
                }

                // console.log(req.useragent)

                WriteError(`Login Failed`, 'warn')

                res.status(401).send(response)
            }

        })
    } catch (error) {
        /**Error information */
        WriteError(`login.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.status(500).send(response)
    }
})


module.exports = router