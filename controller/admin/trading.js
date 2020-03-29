const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../../logs/write')

// Sql transaction
const query = require("../../config/query")
const { getPercentage } = require("../queries")

router.post('/', [
    check('id_currency', 'ID currency is required').isInt(),
    check('percentage', 'Percentaje is requerid').isFloat()
], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(500).json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { percentage, id_currency } = req.body
        const queryScript = (_id = 0, _percentage = 0, _amount = 0) => `
        call createPayment(${_id}, ${_percentage}, ${_amount});`

        query(getPercentage, [percentage, id_currency], async (response) => {
            for (let index = 0; index < response.length; index++) {
                const { id, amount } = response[index];


                await query(queryScript(id, percentage, amount), [], (response) => { }).catch(reason => { throw reason })
            }
            // res.status(200).send(finalScript)

        }).catch(reason => { throw reason })


        res.status(200).send({ response: 'success' })

    } catch (error) {
        console.log(error)
        WriteError(`trading.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.status(500).send(response)
    }
})

module.exports = router