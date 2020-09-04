const express = require('express')
const router = express.Router()
const WriteError = require('../../logs/write.config')

// Sql transaction
const query = require("../../configuration/query.sql")
const { collectionPlan, collectionPlanById } = require("../../configuration/queries.sql")

/**Return investment plans */
router.get('/', async (_, res) => {
    try {
        const response = await query.run(collectionPlan, [])

        res.send(response)

    } catch (error) {
        /**Error information */
        WriteError(`login.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**Return investment plans by id */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        const response = await query.run(collectionPlanById, [id])

        res.send(response)

    } catch (error) {
        /**Error information */
        WriteError(`investment-plan.controller.js | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

module.exports = router