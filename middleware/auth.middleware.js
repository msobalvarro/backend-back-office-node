const jwt = require('jsonwebtoken')
const log = require('../logs/write.config')
const moment = require("moment")

// constants
const { calcReleaseDuration } = require("../configuration/constant.config")

// enviroment
const { JWTSECRET, JWTSECRETSIGN } = require("../configuration/vars.config")


module.exports = {
    auth: (req, res, next) => {
        const token = req.header('x-auth-token')
        // Cabecera que se envía desde el cliente web para ignorar la comprobación de la fecha de lanzamiento
        const ignoreReleaseDate = req.header('ignore-release-date') || false
        // Se obtiene la fecha de lanzamiento del cliente
        const releaseDate = req.header('release-date') || null

        try {
            if (!token) {
                throw String("Token id es requerido")
            }

            const decoded = jwt.verify(token, JWTSECRETSIGN)

            // Assign user to req
            req.user = decoded.user

            // Indicador de actualización requerida para las versiones del release <=1.4.5
            if (releaseDate === null && !ignoreReleaseDate) {
                return res.status(401).json({
                    error: true,
                    message: 'Actualización Requerida'
                })
            }

            // Se verifica si la petición no fue realizada desde el cliente web
            if (!ignoreReleaseDate) {
                let duration = calcReleaseDuration(releaseDate)

                /**
                 * Si el release_date del cliente que realizó la petición es menor que la
                 * actual fecha de lanzamiento, se envía el mensaje de actualización
                 * requerida
                 *  */
                if (duration > 0) {
                    return res.status(426).json({
                        error: true,
                        message: "Actualización es requerida"
                    })
                }
            }

            next()
        } catch (errorMessagge) {
            const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress

            log(`auth.middleware.js - Client authentication token | ${ip} | ${errorMessagge}`)

            return res.status(401).json({
                error: true,
                message: "Tu sesión ha caducado"
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
            const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress

            log(`auth.middleware.js - Root authentication token | ${ip} | ${errorMessagge}`)

            return res.status(401).json({
                error: true,
                message: "Tu sesion ha caducado"
            })
        }
    }
}