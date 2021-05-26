const Express = require('express')
const router = Express.Router()
const register = require('./register.controller')
const upgrade = require('./upgrade.controller')
/*module.exports = {
    register: router.use('/register', register),
    upgrade: router.use('/upgrade', upgrade)
}*/
router.use('/register', register)
router.use('/upgrade', upgrade)

module.exports = router