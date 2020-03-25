const express = require('express')
const router = express.Router()

// Sql transaction
const query = require("../../config/query")
const { getAllSponsored } = require("../queries")

/**Return investment plans by id */
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params

        query(getAllSponsored, [id], (response) => {
            res.status(200).send(response)
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