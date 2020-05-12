'use strict'

const express = require('express')
const bodyParse = require('body-parser')
const cors = require('cors')
const app = express()
const useragent = require('express-useragent')
const publicIp = require('public-ip')
const statusMonitor = require("express-status-monitor")
// const server = require('http').Server(app)
const expressWS = require("express-ws")(app)
// const WebSocket = require('ws')
const session = require('express-session')

// Require .env file
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config()
}

process.setMaxListeners(0)

const { PORT } = process.env

// Middleware authentication - validate hashtoken
const auth = require('./middleware/auth')

/**Admin - backOffice all controllers */
const adminApis = require('./controller/admin/index')

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

/**Collection crypto prices */
const cryptoPrices = require('./controller/collection/crypto-prices')

/**Buy plan */
const BuyPlan = require('./controller/buyPlan')
const UpgradePlan = require('./controller/upgradePlan')

/**Controller for verify account by email */
const verifyAccount = require('./controller/verifyAccount')

/**Controller api for read all logs */
const readLogs = require('./logs/read')

const exchange = require("./controller/exchange")

app.use(cors())

app.use(statusMonitor({ path: '/status', }))

/** ******************* */
app.use(useragent.express())

// session configuration
app.use(session({
	secret: "{_}",
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: false,
		maxAge: 6000000
	}
}))

app.use((req, _, next) => {
	// Verify if prices session exist
	if (!req.session.prices) {
		// Aqui almacenaremos todos los precios de monedas
		// from api coinmarketcap 
		req.session.prices = ""

		// Ultima actualizacion de precio de la moneda
		req.session.priceLastUpdate = "null"
	}

	next()
})

const aWss = expressWS.getWss("/")

app.ws("/", () => {
	app.set("clients", aWss.clients)

	console.log("connect")
})

// User for parse get json petition
app.use(bodyParse.json())

// Api get and post index 
app.get('/', async (_, res) => {
	res.send(await publicIp.v4())
})

app.post('/', (_, res) => {
	res.send('Server error')
})

// Api authentication login
app.use('/login', require('./controller/login'))

// Api register
app.use('/register', require('./controller/register'))

// Collections
app.use('/collection/investment-plan', InvestmentPlans)
app.use('/collection/prices', cryptoPrices)
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

// Api from verify account by user email
app.use('/verifyAccount', verifyAccount)

// Read all logs
app.use("/logs", auth, readLogs)

app.use("/exchange", exchange)

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))
// server.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))