const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Sql transaction
const query = require("../../config/query")
const { comprobateUsername, comprobateUsernameExisting } = require("../queries")

router.get('/', (_, res) => res.send('api running'))

/**Return data user by username */
router.post('/', [
    check('username', 'username is required').exists()
], (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            console.log(errors)
            return res.json({
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

        res.send(response)
    }
})

/**Return data user by username */
router.post('/exist', [
    check('username', 'username is required').exists()
], (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            console.log(errors)
            return res.json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { username } = req.body

        query(comprobateUsernameExisting, [username], (response) => {
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

        res.send(response)
    }
})

module.exports = router