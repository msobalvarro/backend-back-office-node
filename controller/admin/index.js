const express = require('express')
const router = express.Router()

// imports apis configuration
const RegisterRequest = require('./request.admin.controller')
const AllRecords = require('./records.admin.controller')
const AllUpgrades = require('./upgrades.admin.controller')
const Reports = require('./report.admin.controller')
const Trading = require('./trading.admin.controller')
const Email = require('./email.admin.controller')
const ReportPayments = require('./report-payments.controller')
const comission = require("./comission.admin.controller")
const ReportUsers = require("./report-users.admin.controller")
const KycAdmin = require("./kyc.admin.controller")

/**Controller for utils tools */
const utils = require("./utils.admin.controller")

// Solicitudes de registro
router.use('/request', RegisterRequest)

// Registros aprobados
router.use('/records', AllRecords)

// Solicitudes de upgrades
router.use('/upgrades', AllUpgrades)

// Registros aprobados
router.use('/reports', Reports)

// Reportes de estado de cuenta de usuarios
router.use('/reports-users', ReportUsers)

// Funcion para ejecutar el trading de la semana
router.use('/trading', Trading)

// Coleccion de todos los pagos de la semana
router.use('/payments', ReportPayments)

// Api para ejecutar la aplicacion de correos
router.use("/email", Email)

// API para las comissiones
router.use("/comission", comission)

// controlador para utilidades
router.use("/utils", utils)

// Controlador par las visualizaciones del kyc de los usuarios
router.use("/kyc", KycAdmin)

module.exports = router
