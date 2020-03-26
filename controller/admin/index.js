const express = require('express')
const router = express.Router()

// imports apis configuration
const RegisterRequest = require('./request')
const AllRecords = require('./records')

router.get('/', (_, res) => res.status(500))

// Solicitudes de registro
router.use('/request', RegisterRequest)

// Registros aprobados
router.use('/records', AllRecords)

module.exports = router
