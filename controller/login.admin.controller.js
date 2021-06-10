const express = require('express')
const router = express.Router()
const WriteError = require('../logs/write.config')
const { check, validationResult } = require('express-validator')
const loginService = require('../services/login.service')

// validammos los parametros
const validationParams = [
    check('email', 'Please include a valid user email').isEmail(),
    check('password', 'Password is required').exists(),
]

// Validate data params with express validator
router.post('/', validationParams, async (req, res) => {
    try {
        const errors = validationResult(req)

        // check if there errors
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // get params 
        const { email, password } = req.body

        // execute process
        const dataLogin = await loginService.backOffice(email, password)

        res.send(dataLogin)

    } catch (error) {
        /**Error information */
        WriteError(`login.admin.controller.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

router.post("/create", async (req, res) => {
    try {
        // get params
        const { email, name, password } = req.body

        // execute service
        const dataResponse = await loginService.addAdminUser({ email, name, password })

        res.send(dataResponse)

    } catch (error) {
        res.send({ error: true, message: error.toString() })
    }
})


module.exports = router