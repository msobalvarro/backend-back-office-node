const express = require('express')
const router = express.Router()

// Sql transaction
const query = require("../../config/query")
const { collectionPlan } = require("../queries")

router.get('/', (req, res) => {
    try {        
        console.log('test')

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

        res.status(500).send(response)
    }
})

module.exports = router