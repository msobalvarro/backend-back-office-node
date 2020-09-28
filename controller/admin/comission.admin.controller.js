const express = require('express')
const router = express.Router()

// import mysql configuration
const sql = require("../../configuration/sql.config")
const { getActiveCommissions } = require("../../configuration/queries.sql")

// import constants and functions
const log = require("../../logs/write.config")

router.get("/", async (_, res) => {
    try {
        const dataQuery = await sql.run(getActiveCommissions)


        res.send(dataQuery)
    } catch (message) {
        log(`comission.admin.controller.js | error al obtener la lista | ${message.toString()}`)

        res.send({ error: true, message })
    }
})

router.get("/details", (req, res) => {
    try {
        
    } catch (message) {
        log(`comission.admin.controller.js | error al obtener detalle de la comission | ${message.toString()}`)

        res.send({ error: true, message })
    }
})

module.exports = router