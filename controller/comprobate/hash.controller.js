const express = require('express')
const { default: validator } = require('validator')
const router = express.Router()
const { WALLETSAPP, clearHash } = require("../../configuration/constant.config")
const { bitcoin, dash, ethereum } = require('../../middleware/hash.middleware')

router.post('/bitcoin', async (req, res) => {

    const { amount, hash } = req.body

    const validate = await bitcoin(hash, amount, WALLETSAPP.BITCOIN)
    // const validate = await bitcoin(hash, amount, WALLETSAPP.BITCOIN)

    res.send({ hash, amount, validate })
})

router.post('/ethereum', async (req, res) => {

    const { amount, hash } = req.body

    const validate = await ethereum(hash, amount, WALLETSAPP.ETHEREUM)
    // const validate = await bitcoin(hash, amount, WALLETSAPP.BITCOIN)

    res.send({ hash: clearHash(hash), amount, validate })
})

module.exports = router