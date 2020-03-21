const express = require('express')
const bodyParse = require('body-parser')
const app = express()
const useragent = require('express-useragent')

// Middleware authentication - validate hashtoken
const auth = require('./middleware/auth')

// Require .env file
require('dotenv').config()
const { PORT } = process.env

// Imports collections data

/**Collection investment plans */
const InvestmentPlans = require('./controller/collection/investment-plan')

/**Collection comprobations */
const ComprobateUsername = require('./controller/comprobate/username')

app.use(useragent.express())

// Use configuration in developer MODE
app.use((_, res, next) => {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', `http://localhost:${PORT}`);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
})

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

// Comprobate data
app.use('/comprobate/username', ComprobateUsername)

// Api Control exceptions App
app.use('/controlError', auth, require('./controller/exceptions'))

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))