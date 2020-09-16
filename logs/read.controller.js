const fs = require('fs')
const express = require('express')
const router = express.Router()
const WriteError = require("./write.config")

router.get('/', async (_, res) => {
    try {
        const readStream = fs.createReadStream(__dirname + "/logs.log", "utf8")

        let dataCount = null

        readStream.on('data', (chunk) => {
            dataCount = chunk.split("\n")
        }).on('end', () => {
            res.send(dataCount)
        })

    } catch (error) {
        WriteError(`dashboard-details.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router
