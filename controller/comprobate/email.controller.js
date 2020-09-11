const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Sql transaction
const sql = require("../../configuration/sql.config")
const { comprobateEmail } = require("../../configuration/queries.sql")

router.get('/', (_, res) => res.status(200))

/**Return data user by username */
router.post('/', [
    check('email', 'email is required').isEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { email } = req.body

        const response = await sql.run(comprobateEmail, [email])

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