const express = require('express')
const bodyParse = require('body-parser')
const cors = require('cors')
const app = express()
const useragent = require('express-useragent')

// Middleware authentication - validate hashtoken
const auth = require('./middleware/auth')

const adminApis = require('./controller/admin/index')

// Require .env file
if (process.env.NODE_ENV !== 'production') require('dotenv').config()
const { PORT } = process.env

// Imports collections data

/**Collection investment plans */
const InvestmentPlans = require('./controller/collection/investment-plan')

/**Collection sponsored */
const Sponsors = require('./controller/collection/sponsors')

/**Collection comprobations */
const ComprobateUsername = require('./controller/comprobate/username')

/**Collection get data dashboard */
const DataDashboard = require('./controller/dashboard-details')

/**Buy plan */
const BuyPlan = require('./controller/BuyPlan')
const UpgradePlan = require('./controller/upgradePlan')

app.use(useragent.express())

// Use configuration in developer MODE
app.use(cors({
	origin: false,
}))

// User for parse get json petition
app.use(bodyParse.json())

// Api get and post index 
app.get('/', (_, res) => {
	res.send('Api runing')
})

app.post('/', (_, res) => {
	res.status(500).send('Server error')
})

// Api authentication login
app.use('/login', require('./controller/login'))

// Api register
app.use('/register', require('./controller/register'))

// Collections
app.use('/collection/investment-plan', InvestmentPlans)
app.use('/collection/sponsors', auth, Sponsors)

// Comprobate data
app.use('/comprobate/username', ComprobateUsername)

// Api data dashboard
app.use('/data/dashboard', DataDashboard)

// Api Control exceptions App
app.use('/controlError', auth, require('./controller/exceptions'))

// Buy plan investment
app.use('/buy/plan', BuyPlan)

// Upgrade plan
app.use('/buy/upgrade', UpgradePlan)

// Api authentication backOffice login
app.use('/admin-login', require('./controller/login-admin'))

// APIS for admin - back office
app.use('/admin', auth, adminApis)

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))