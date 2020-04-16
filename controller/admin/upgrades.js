const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../../logs/write')

// Sql transaction
const query = require("../../config/query")
const { getAllUpgrades, getUpgradeDetails, declineUpgrade, acceptUpgrade } = require("../queries")

router.get('/', (_, res) => {
    try {
        query(getAllUpgrades, [], (response) => res.status(200).send(response[0])).catch(reason => { throw reason })
    } catch (error) {
        /**Error information */
        WriteError(`request.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

router.post('/id', [check('id', 'ID is not valid').isInt()], (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id } = req.body

        query(getUpgradeDetails, [id], (response) => res.status(200).send(response[0][0])).catch(reason => { throw reason })

    } catch (error) {
        /**Error information */
        WriteError(`request.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

router.delete('/decline', [check('id', 'ID is not valid').isInt()], (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id } = req.body

        query(declineUpgrade, [id], _ => res.status(200).send({ response: 'success' })).catch(reason => { throw reason })

    } catch (error) {
        /**Error information */
        WriteError(`request.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

router.post('/accept', [check('id', 'ID is not valid').isInt()], (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id } = req.body

        query(acceptUpgrade, [id], (response) => {
            res.status(200).send(response[0])

            // res.status(200).send({ response: 'success' })
        }).catch(reason => { throw reason })

    } catch (error) {
        /**Error information */
        WriteError(`request.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

module.exports = router