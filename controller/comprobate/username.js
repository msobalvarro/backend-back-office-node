const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Sql transaction
const query = require("../../config/query")
const { comprobateUsername } = require("../queries")

router.get('/', (_, res) => res.send('api running'))

/**Return data user by username */
router.post('/', [
    check('username', 'username is required')
], (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            console.log(errors)
            return res.status(500).json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { username } = req.body

        query(comprobateUsername, [username], (response) => {
            res.send(response)
        })
        .catch(reason => {
            throw reason
        })

    } catch (error) {
        const response = {
            error: true,
            message: error.toString()
        }

        res.status(500).send(response)
    }
})

module.exports = router