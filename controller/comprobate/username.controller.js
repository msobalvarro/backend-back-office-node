const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Sql transaction
const sql = require("../../configuration/sql.config")
const { comprobateUsername, comprobateUsernameExisting } = require("../../configuration/queries.sql")

router.get('/', (_, res) => res.send('api running'))

/**Return data user by username */
router.post('/', [
    check('username', 'username is required').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            console.log(errors)
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { username } = req.body

        const response = await sql.run(comprobateUsername, [username])

        res.send(response)
    } catch (error) {
        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

/**Return data user by username */
router.post('/exist', [
    check('username', 'username is required').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { username } = req.body

        const response = await sql.run(comprobateUsernameExisting, [username])
        console.log(response)

        res.send(response)

    } catch (error) {
        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router