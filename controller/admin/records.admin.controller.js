const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../../logs/write.config')

// Sql transaction
const sql = require("../../configuration/sql.config")
const { getAllRecords, getRecordDetails } = require("../../configuration/queries.sql")

router.get('/', async (_, res) => {
    try {
        const response = await sql.run(getAllRecords)

        res.send(response[0])
    } catch (error) {
        /**Error information */
        WriteError(`records.js - catch execute sql | ${error}`)

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

        const response = await sql.run(getRecordDetails, [id])

        res.status(200).send(response[0][0])

    } catch (error) {
        /**Error information */
        WriteError(`records.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

module.exports = router