const express = require('express')
const router = express.Router()

// imports apis configuration
const RegisterRequest = require('./request')
const AllRecords = require('./records')
const Reports = require('./report')
const Trading = require('./trading')

router.get('/', (_, res) => res.status(500))

// Solicitudes de registro
router.use('/request', RegisterRequest)

// Registros aprobados
router.use('/records', AllRecords)

// Registros aprobados
router.use('/report', Reports)

router.use('/trading', Trading)

module.exports = router
