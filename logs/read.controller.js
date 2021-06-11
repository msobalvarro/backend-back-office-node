const fs = require('fs')
const express = require('express')
const router = express.Router()
const WriteError = require("./write.config")

router.get('/', async (_, res) => {
    try {
        // stream for logs
        const readStreamLogs = fs.createReadStream(__dirname + "/logs.log", "utf8")

        // stream file for actions history
        const readStreamActions = fs.createReadStream(__dirname + "/actions/actions.log", "utf8")

        const data = {
            logs: null,
            actions: null
        }

        // read and send
        readStreamLogs.on('data', (chunk) => data.logs = chunk.split("\n")).on("end", _ => {
            readStreamActions.on('data', (chunk) => data.actions = chunk.split("\n")).on("end", _ => res.send(data))
        })

    } catch (error) {
        WriteError(`read.controller.js - error al leer logs | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router
