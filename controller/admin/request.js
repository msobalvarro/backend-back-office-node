const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Sql transaction
const query = require("../../config/query")
const { getAllRequest, getRequestDetails } = require("../queries")

router.get('/', (_, res) => {
    try {
        console.log('for collection')

        query(getAllRequest, [], (response) => {
            res.send(response[0])
        })
            .catch(reason => {
                throw reason
            })

    } catch (error) {
        /**Error information */
        WriteError(`login.js - catch execute query | ${error}`)

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

        query(getRequestDetails, [id], (response) => {
            res.send(response[0][0])
        })
            .catch(reason => {
                throw reason
            })

    } catch (error) {
        /**Error information */
        WriteError(`login.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.status(500).send(response)
    }
})

module.exports = router