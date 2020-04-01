const express = require('express')
const bodyParse = require('body-parser')
const cors = require('cors')
const app = express()
const useragent = require('express-useragent')
const publicIp = require('public-ip')

// Middleware authentication - validate hashtoken
const auth = require('./middleware/auth')

const adminApis = require('./controller/admin/index')

// Require .env file
if (process.env.NODE_ENV !== 'production') require('dotenv').config()
const { PORT } = process.env

const { DBHOST, DBNAME, DBUSER, DBPASS } = process.env

// Imports collections data

/**Collection investment plans */
const InvestmentPlans = require('./controller/collection/investment-plan')

/**Collection sponsored */
const Sponsors = require('./controller/collection/sponsors')

/**Collection comprobations */
const ComprobateUsername = require('./controller/comprobate/username')
const ComprobateEmail = require('./controller/comprobate/email')

/**Collection get data dashboard */
const DataDashboard = require('./controller/dashboard-details')

/**Buy plan */
const BuyPlan = require('./controller/BuyPlan')
const UpgradePlan = require('./controller/upgradePlan')


// Use configuration in developer MODE
app.use(cors())

app.use(useragent.express())

// User for parse get json petition
app.use(bodyParse.json())

// Api get and post index 
app.get('/', async (_, res) => {
	res.send(await publicIp.v4())
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
app.use('/comprobate/email', ComprobateEmail)

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