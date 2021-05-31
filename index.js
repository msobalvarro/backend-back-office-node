'use strict'

const bodyParse = require('body-parser')
const useragent = require('express-useragent')
const publicIp = require('public-ip')

const {
    express,
    app,
    server,
    socketAdmin,
    morganDeployment
} = require('./configuration/constant.config')

const cron = require('node-cron')
const { interestGenerationProcess } = require('./controller/alytrade/cronjob')
/**
 * Configurando la carpeta raíz del proyecto para cargar las credenciales de
 * de la cuenta de servicio del bucket
 */
const path = require('path')
global.appRootDir = path.resolve(__dirname)

process.setMaxListeners(0)

// import vars
const { PORT } = require('./configuration/vars.config')

// Imports middlewares
const cors = require('cors')
const helmet = require('helmet')
const uest = require('uest')
const {
    auth,
    authRoot,
    socketDecodeTokenAdmin,
} = require('./middleware/auth.middleware')

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
const exchange = require('./controller/exchange.controller')

/**Api Controller for change info user profile */
const profile = require('./controller/profile.controller')

/**Api para administra, y obtener terminos y condiciones */
const temsController = require('./controller/terms.controller')

/**Money Changer Api */
const moneyChanger = require('./controller/money-changer.controller')

const blockchain = require('./controller/block.config')

/**Controle for validation hash */
const hash = require('./controller/comprobate/hash.controller')

/**Controller for reset password */
const resetPassword = require('./controller/reset-password.controller')

/**Controlador para registrar usuarios */
const registerController = require('./controller/register.controller')

/**Controlador para login de los usuarios */
const loginController = require('./controller/login.controller')

/**Controllers for upload/download files */
const fileController = require('./controller/file.controller')
const fileAdminController = require('./controller/file.admin.controller')

/** Kyc User controller */
const kycUserController = require('./controller/kyc-user.controller')
/** Kyc Ecommerce controller */
const kycEcommerceController = require('./controller/kyc-ecommerce.controller')

// import services
const counterPrices = require('./services/save-prices.service')
const alytrade = require('./controller/alytrade')

/**
 * New controller for data dashboard (BETA)
 */
const dashboard = require('./controller/dashboard.controller')

const controlQuestionsController = require('./controller/collection/control-questions.controller')

// Encendemos el servicio
counterPrices.on()

app.use(uest())

app.use(helmet())

app.use(cors())

/** ******************* */
app.use(useragent.express())

// User for parse get json petition
app.use(express.urlencoded({ extended: true }))
app.use(bodyParse.json({ limit: '50mb' }))

// For morgan debugging in development issues
morganDeployment()

// Api get and post index
app.get('/', async (_, res) => {
    res.send(await publicIp.v4())
})

// Api authentication login
app.use('/login', loginController)

// Api register
app.use('/register', registerController)

// Collections
app.use('/collection/investment-plan', InvestmentPlans)
app.use('/collection/prices', cryptoPrices)
app.use('/collection/sponsors', Sponsors)
app.use('/collection/directions', DirectionsController)
app.use('/collection/control-questions', controlQuestionsController)

// Comprobate data
app.use('/comprobate/username', ComprobateUsername)
app.use('/comprobate/email', ComprobateEmail)

// Api data dashboard
app.use('/data/dashboard', DataDashboard)

// beta
app.use('/dashboard', dashboard)

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

// Apis for upload/download images files
app.use('/file', fileController)

app.use('/file-admin', fileAdminController)

// Read all logs
app.use('/logs', authRoot, readLogs)

app.use('/exchange', exchange)

app.use('/profile', profile)

app.use('/blockchain', blockchain)

app.use('/validation', hash)

app.use('/money-changer', moneyChanger)

app.use('/reset-password', resetPassword)

app.use('/kyc/user', auth, kycUserController)

app.use('/kyc/ecommerce', auth, kycEcommerceController)

app.use('/terms', temsController)

app.use('/alytrade', alytrade)

socketAdmin.use(socketDecodeTokenAdmin)

// on conection admin
socketAdmin.on('connection', admin =>
    console.log(`Admin connected to socket: ${admin.client.id}`)
)

/**
 * Calendarizacion del proceso de calculo y generacion de intereses de Alytrade
 */
const schedule = process.env.ALYTRADE_PROCESS_SCHEDULE || "0 23 * * *"
console.log(`El proceso se ejecuta en la siguiente agenda ${schedule}`)
cron.schedule(schedule, () => {
    interestGenerationProcess()
})

server.listen(PORT, () => console.log(`App running in port ${PORT}`))