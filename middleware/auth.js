const jwt = require('jsonwebtoken')
const WriteError = require('../logs/write')
// require('dotenv').config()

const { JWTSECRET } = process.env


module.exports = (req, res, next) => {
    const token = req.header('x-auth-token')

    try {
        if (!token) {
            throw 'No token, authorization denied'
        }

        const decoded = jwt.verify(token, JWTSECRET)

        // Assign user to req
        req.user = decoded.user

        next()
    } catch (errorMessagge) {
        WriteError(`auth.js - error in authentication token | ${errorMessagge}`)

        return res.status(401).json({
            error: true,
            message: errorMessagge.toString()
        })
    }
}