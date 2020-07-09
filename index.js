'use strict'

const express = require('express')
const bodyParse = require('body-parser')
const app = express()
const useragent = require('express-useragent')
const publicIp = require('public-ip')
const statusMonitor = require("express-status-monitor")
const expressWS = require("express-ws")(app)

// const WebSocket = require('ws')
const session = require('express-session')

// Require .env file
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config()
}

process.setMaxListeners(0)

const { PORT } = process.env

// Imports middlewares
const cors = require('cors')
const helmet = require('helmet')
const auth = require('./middleware/auth')
const authAdmin = require('./middleware/authAdmin')

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

/**Api controller for exchange */
const exchange = require("./controller/exchange")

/**Api Controller for change info user profile */
const profile = require("./controller/profile")

/**Money Changer Api */
const moneyChanger = require("./controller/money-changer")

const blockchain = require('./controller/block')

/**Controle for validation hash */
const hash = require("./controller/comprobate/hash")

/**Controller for reset password */
const resetPassword = require("./controller/reset-password")

app.use(helmet())

app.use(cors())

// Charts for server monitor usage
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
		req.session.minPrices = ""

		// Ultima actualizacion de precio de la moneda
		req.session.priceLastUpdate = "null"
		req.session.minPriceLastUpdate = "null"
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
app.use(bodyParse.urlencoded({ extended: true }))

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
app.use('/admin', authAdmin, adminApis)

// Api from verify account by user email
app.use('/verifyAccount', verifyAccount)

// Read all logs
app.use("/logs", auth, readLogs)

app.use("/exchange", exchange)

app.use("/profile", profile)

app.use("/blockchain", blockchain)

app.use("/validation", hash)

app.use("/money-changer", moneyChanger)

app.use("/reset-password", resetPassword)

app.listen(PORT, () => console.log(`App running in port ${PORT}`))