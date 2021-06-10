const Express = require('express')
const router = Express.Router()
const userManagement = require('./userManage.controller')

router.use('/', userManagement)

module.exports = router