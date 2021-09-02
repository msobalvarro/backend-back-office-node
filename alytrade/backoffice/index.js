const Express = require('express')
const router = Express.Router()
const usersController = require('./Controllers/Users.controller')

router.use(usersController)

module.exports = router