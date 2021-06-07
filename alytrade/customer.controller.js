const Express = require('express')
const router = Express.Router()
const { check, validationResult } = require('express-validator')
const { getAlytradeInvestmentsByUserId, getAlytradeInvestmentInterestByInvestment } = require('./repository')

const checkRequestUI = [
    check('userId', "userId is required").exists().isNumeric()
]
router.post('/userInvestments', checkRequestUI, async (req, res) => {
    const errors = validationResult(req)
    try {
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { userId } = req.body

        const result = await getAlytradeInvestmentsByUserId(userId)
        res.status(200).send(result)
    } catch (err) {
        res.status(500).send({ error: err })
    }
})

const checkRequestInterest = [
    check('investmentId', "investmentId is required").isNumeric().exists(),
]
router.post('/investmentInterest', checkRequestInterest, async (req, res) => {
    const errors = validationResult(checkRequestInterest)
    try {
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }
        const { investmentId } = req.body

        const result = await getAlytradeInvestmentInterestByInvestment(investmentId)
        res.status(200).send(result)
    } catch (err) {
        res.status(500).send({ error: err })
    }
})

module.exports = router