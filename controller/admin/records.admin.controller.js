const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../../logs/write.config')

// Sql transaction
const query = require("../../configuration/query.sql")
const { getAllRecords, getRecordDetails } = require("../../configuration/queries.sql")

router.get('/', async (_, res) => {
    try {
        const response = await query.run(getAllRecords)

        res.status(200).send(response[0])
    } catch (error) {
        /**Error information */
        WriteError(`records.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

router.post('/id', [check('id', 'ID is not valid').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id } = req.body

        const response = await query.run(getRecordDetails, [id])

        res.status(200).send(response[0][0])

    } catch (error) {
        /**Error information */
        WriteError(`records.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

module.exports = router