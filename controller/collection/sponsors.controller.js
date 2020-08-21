const express = require('express')
const router = express.Router()
const WriteError = require('../../logs/write.config')

// Sql transaction
const query = require("../../configuration/query.sql")
const { getAllSponsored } = require("../../configuration/queries.sql")

// import middleware
const { auth } = require('../../middleware/auth.middleware')

/**Return investment plans by id */
router.get('/:id', auth, (req, res) => {
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

        res.send(response)
    }
})

module.exports = router