const express = require('express')
const router = express.Router()
const WriteError = require('../../logs/write.config')

// Sql transaction
const query = require("../../configuration/query.sql")
const { collectionPlan, collectionPlanById } = require("../../configuration/queries.sql")

/**Return investment plans */
router.get('/', (_, res) => {
    try {

        query(collectionPlan, [], (response) => {
            res.send(response)
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

        res.send(response)
    }
})

/**Return investment plans by id */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params        

        query(collectionPlanById, [id], (response) => {
            res.send(response)
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

        res.send(response)
    }
})

module.exports = router