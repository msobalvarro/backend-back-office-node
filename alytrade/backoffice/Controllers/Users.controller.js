const Express = require('express')
const Route = Express.Router()
const userService = require('../Services/Users.service')

Route.get('/users', async (req, res) => {
    const users = await userService.getLastUser()
    res.status(200).send(users)
    return
})

Route.post('/findUsers', async (req, res) => {

    const { username, page, pageSize } = req.body

    const users = await userService.findUsers({
        username, page, pageSize
    })

    res.status(200).send(users)

    return
})

module.exports = Route