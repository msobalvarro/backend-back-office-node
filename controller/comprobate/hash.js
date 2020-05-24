const express = require('express')
const router = express.Router()
const { bitcoin, dash, ethereum } = require('../../middleware/hash')

router.post('/bitcoin/:hash', async (req, res) => {
    const { hash } = req.params

    const { amount } = req.body

    const validate = await bitcoin(hash, amount)

    res.send({ hash, amount, validate })
})

router.post('/dash/:hash', async (req, res) => {
    const { hash } = req.params

    const { amount } = req.body

    const validate = await dash(hash, amount)

    res.send({ hash, amount, validate })
})

router.post('/ethereum/:hash', async (req, res) => {
    const { hash } = req.params

    const { amount } = req.body

    const validate = await ethereum(hash, amount)

    res.send({ hash, amount, validate })
})


module.exports = router