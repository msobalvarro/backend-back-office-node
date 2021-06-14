const Express = require('express')
const router = Express.Router()
const userManagement = require('./userManage.controller')
const customer = require('./customer.controller')

router.use('/', userManagement)
router.use('/', customer)

module.exports = router