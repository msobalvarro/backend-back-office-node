const express = require('express')
const router = express.Router()

// Controles
const InvestmentPlans = require('./investment-plan')


router.get('/', (req, res) => res.send('Collection'))


router.get('/investment-plan', InvestmentPlans)


module.exports = router;