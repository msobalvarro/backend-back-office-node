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

process.setMaxListeners(0)

// import vars
const { PORT } = require("./configuration/vars.config")

// Imports middlewares
const cors = require('cors')
const helmet = require('helmet')
const { auth, authRoot } = require('./middleware/auth.middleware')

/**Admin - backOffice all controllers */
const adminApis = require('./controller/admin/index')

// Imports collections data
/**Collection investment plans */
const InvestmentPlans = require('./controller/collection/investment-plan.controller')

/**Collection sponsored */
const Sponsors = require('./controller/collection/sponsors.controller')

/**Collection comprobations */
const ComprobateUsername = require('./controller/comprobate/username.controller')
const ComprobateEmail = require('./controller/comprobate/email.controller')

/** Collection directions */
const DirectionsController = require('./controller/collection/directions.controller')

/**Collection get data dashboard */
const DataDashboard = require('./controller/dashboard-details.controller')

/**Collection crypto prices */
const cryptoPrices = require('./controller/collection/crypto-prices.controller')

/**Buy plan */
const BuyPlan = require('./controller/buy-plan.controller')
const UpgradePlan = require('./controller/upgrade-plan.controller')

/**Controller for verify account by email */
const verifyAccount = require('./controller/verify-account.controller')

/**Controller api for read all logs */
const readLogs = require('./logs/read.controller')

/**Api controller for exchange */
const exchange = require("./controller/exchange.controller")

/**Api Controller for change info user profile */
const profile = require("./controller/profile.controller")

/**Money Changer Api */
const moneyChanger = require("./controller/money-changer.controller")

const blockchain = require('./controller/block.config')

/**Controle for validation hash */
const hash = require("./controller/comprobate/hash.controller")

/**Controller for reset password */
const resetPassword = require("./controller/reset-password.controller")

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

	console.log("An administrator has logged in")
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
app.use('/login', require('./controller/login.controller'))

// Api register
app.use('/register', require('./controller/register.controller'))

// Collections
app.use('/collection/investment-plan', InvestmentPlans)
app.use('/collection/prices', cryptoPrices)
app.use('/collection/sponsors', Sponsors)
app.use("/collection/directions", DirectionsController)

// Comprobate data
app.use('/comprobate/username', ComprobateUsername)
app.use('/comprobate/email', ComprobateEmail)

// Api data dashboard
app.use('/data/dashboard', DataDashboard)

// Api Control exceptions App
app.use('/controlError', auth, require('./controller/exceptions.controller'))

// Buy plan investment
app.use('/buy/plan', BuyPlan)

// Upgrade plan
app.use('/buy/upgrade', UpgradePlan)

// Api authentication backOffice login
app.use('/admin-login', require('./controller/login.admin.controller'))

// APIS for admin - back office
app.use('/admin', authRoot, adminApis)

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