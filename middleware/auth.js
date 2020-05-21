const jwt = require('jsonwebtoken')
const WriteError = require('../logs/write')
if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const { JWTSECRET } = process.env


module.exports = (req, res, next) => {
    const token = req.header('x-auth-token')

    try {
        if (!token) {
            return res.status(401).json({
                error: true,
                message: "Token id es requerido"
            })
        }

        const decoded = jwt.verify(token, JWTSECRET)

        // Assign user to req
        req.user = decoded.user

        next()
    } catch (errorMessagge) {
        WriteError(`auth.js - error in authentication token | ${errorMessagge}`)

        return res.status(401).json({
            error: true,
            message: "Tu sesion ha caducado"
        })
    }
}