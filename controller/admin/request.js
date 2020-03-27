const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../../logs/write')

// Sql transaction
const query = require("../../config/query")
const { getAllRequest, getRequestDetails, declineRequest } = require("../queries")

router.get('/', (_, res) => {
    try {
        query(getAllRequest, [], (response) => res.status(200).send(response[0])).catch(reason => { throw reason })
    } catch (error) {
        /**Error information */
        WriteError(`request.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.status(500).send(response)
    }
})

router.post('/id', [check('id', 'ID is not valid').isInt()], (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(500).json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id } = req.body

        query(getRequestDetails, [id], (response) => res.status(200).send(response[0][0])).catch(reason => { throw reason })

    } catch (error) {
        /**Error information */
        WriteError(`request.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.status(500).send(response)
    }
})

router.delete('/decline', [check('id', 'ID is not valid').isInt()], (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(500).json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id } = req.body

        query(declineRequest, [id], _ => res.status(200).send({ response: 'success' })).catch(reason => { throw reason })

    } catch (error) {
        /**Error information */
        WriteError(`request.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.status(500).send(response)
    }
})

module.exports = router