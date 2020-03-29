const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../../logs/write')

// Sql transaction
const query = require("../../config/query")
const { getAllSponsored, getProfits } = require("../queries")

router.get('/', (_, res) => res.status(500))

router.post('/', [check('id', 'ID is required').isInt()], async (req, res) => {
    const errors = validationResult(req)

    try {
        if (!errors.isEmpty()) {
            return res.status(500).json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id } = req.body

        console.log(id)

        // Obtenemos detalles de ganancia en cada monead
        const profits_BTC = await query.withPromises(getProfits, [id, 1])
        const profits_ETH = await query.withPromises(getProfits, [id, 2])

        const sponsors = await query.withPromises(getAllSponsored, [id])


        Promise.all([profits_BTC, profits_ETH, sponsors])
            .then(values => {
                const data = {
                    btc: values[0][0],
                    eth: values[1][0],
                    sponsors: values[2],
                }

                res.status(200).send(data)
            })
            .catch(reason => {
                throw reason
            })

    } catch (error) {
        /**Error information */
        WriteError(`report.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.status(500).send(response)
    }

})

module.exports = router