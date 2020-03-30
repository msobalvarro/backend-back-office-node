const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const Crypto = require('crypto-js')

// require('dotenv').config()

const WriteError = require('../logs/write')
const query = require('../config/query')
const queries = require('./queries')


const { JWTSECRET } = process.env

router.get('/', (_, res) => {
    res.status(500).send('Server Error')
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
], (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors)

        return res.status(500).json({
            error: true,
            message: errors.array()[0].msg
        })
    }

    try {
        const {
            // This paramas is required
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
            username_sponsor,
            id_currency,
            amount,
        } = req.body
        query(queries.register, [
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
        ], (response) => {
            console.log(response)

            res.status(200).send(response[0][0])
        }).catch(reason => {
            throw reason
        })


    } catch (error) {
        /**Error information */
        WriteError(`register.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.status(500).send(response)
    }
})

module.exports = router