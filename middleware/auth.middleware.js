const jwt = require('jsonwebtoken')
const WriteError = require('../logs/write.config')

// enviroment
const { JWTSECRET } = require("../configuration/vars.config")


module.exports = {
    auth: (req, res, next) => {
        const token = req.header('x-auth-token')

        try {
            if (!token) {
                throw String("Token id es requerido")
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
    },

    authRoot: (req, res, next) => {
        const token = req.header('x-auth-token')

        try {
            if (!token) {
                throw String("Token id es requerido")
            }

            const decoded = jwt.verify(token, JWTSECRET)

            if (decoded.root) {
                // Assign user to req
                req.user = decoded.user

                next()
            } else {
                throw String("No tienes privilegios")
            }

        } catch (errorMessagge) {
            WriteError(`auth.js - error in authentication token | ${errorMessagge}`)

            return res.status(401).json({
                error: true,
                message: "Tu sesion ha caducado"
            })
        }
    }
}