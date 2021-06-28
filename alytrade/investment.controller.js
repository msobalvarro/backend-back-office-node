const express = require('express')
const { check, validationResult } = require('express-validator')
const router = express.Router()
const WriteError = require('../logs/write.config')
const queries = require('./sql')

// sql configuration
const sql = require('../configuration/sql.config')




module.exports = router