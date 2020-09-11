const express = require('express')
const router = express.Router()
const { WALLETSAPP } = require("../../configuration/constant.config")
const { bitcoin, dash, ethereum } = require('../../middleware/hash.middleware')

router.post('/bitcoin', async (req, res) => {

    const { amount, hash } = req.body

    const validate = await bitcoin(hash, amount, WALLETSAPP.BITCOIN)
    // const validate = await bitcoin(hash, amount, WALLETSAPP.BITCOIN)

    res.send({ hash, amount, validate })
})

router.post('/dash/:hash', async (req, res) => {
    const { hash } = req.params

    const { amount } = req.body

    const validate = await dash(hash, amount)

    res.send({ hash, amount, validate })
})


router.post('/ethereum', async (req, res) => {

    const { amount, hash } = req.body

    const validate = await ethereum(hash, amount, WALLETSAPP.ETHEREUM)
    // const validate = await bitcoin(hash, amount, WALLETSAPP.BITCOIN)

    res.send({ hash, amount, validate })
})

module.exports = router