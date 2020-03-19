const express = require('express')
const WriteError = require('../logs/write')
const router = express.Router()

router.post('/', (req, res) => {
    const { message } = req.body

    try {
        WriteError(message, 'web aplication', true)
    } catch (errorCatch) {
        WriteError(errorCatch)
    } finally {
        return res.status(200)
    }
})


module.exports = router