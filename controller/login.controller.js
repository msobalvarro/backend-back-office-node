const express = require('express')
const router = express.Router()
const log = require('../logs/write.config')
const { check, validationResult } = require('express-validator')

// import services
const loginService = require('../services/login.service')



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

        const { email, password, web = false } = req.body
        
        // execute service
        const responseLogin = await loginService.user(email, password, web)

        // enviamos los datos de informacion
        res.send(responseLogin)

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