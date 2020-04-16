const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../../logs/write')

// Sql transaction
const query = require("../../config/query")
const { getAllPayments } = require("../queries")

router.get('/', (_, res) => res.status(500))

router.post('/', [check('id_currency', 'Currency ID is required').isInt()], async (req, res) => {
    const errors = validationResult(req)

    try {
        if (!errors.isEmpty()) {
            return res.json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id_currency } = req.body

        query(getAllPayments, [id_currency], (response) => res.status(200).send(response[0]))
            .catch(reason => {
                throw reason
            })

    } catch (error) {
        /**Error information */
        WriteError(`report-payments.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }

})

module.exports = router