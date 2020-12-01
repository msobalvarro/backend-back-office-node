const jwt = require('jsonwebtoken')
const log = require('../logs/write.config')

// enviroment
const { JWTSECRET, JWTSECRETSIGN } = require("../configuration/vars.config")
const { APP_VERSION } = require('../configuration/constant.config')


module.exports = {
    auth: (req, res, next) => {
        const token = req.header('x-auth-token')
        const appversion = req.header('appversion') || false

        try {
            // verificamos que el usuario envia el token
            if (!token) {
                throw new Error()
            }

            // descodificamos el token si existe
            const decoded = jwt.verify(token, JWTSECRETSIGN)

            // Assign user to req
            req.user = decoded.user

            // validamos si hay que actualizar
            if (!decoded.update) {
                throw new Error()
            }

            // Sí accedió desde la app, verificamos si tiene que volver a inicar sessión
            if (!decoded.web && !decoded.appversion) {
                throw new Error()
            }

            // Se envía el mensaje de actualización requerida
            if (
                // Condicional para las versiones anteriores al kyc movil
                (!decoded.web && !appversion) ||
                // condicional para las nuevas versiones
                (appversion && decoded.appversion < APP_VERSION)
            ) {
                /**
                 * StatusCode 426, muestra el modal de actualización requerida para las
                 * nuevas versiones de la app (superiores a la versión del kyc). 401,
                 * indica el mensaje de actualización requerida de la app en las antiguas
                 * versiones
                 */
                const statusCode = appversion ? 426 : 401

                return res.status(statusCode).json({
                    error: true,
                    message: "Actualizacón requerida"
                })
            }

            // si todo va bien continuamos chingón
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
    },

    /**
     * Valida el token de entrada del socket para comercios
     * 
     */
    socketDecodeTokenAdmin: (socket, next) => {
        try {
            // verificamos si viene los parametros necesarios
            if (socket.handshake.query && socket.handshake.query.token) {
                jwt.verify(socket.handshake.query.token, JWTSECRET, (err, decoded) => {
                    // verificamos si hay un error en jwt
                    if (err) {
                        throw new Error()
                    }

                    // asignamos el decoded en el socket
                    socket.handshake.email = decoded.user.email
                    next()
                })
            }
            else {
                throw new Error()
            }
        } catch (error) {
            socket.disconnect()

            log(`auth.middleware | socketDecodeTokenEcommerce`)

            next(new Error('Authentication error'))
        }
    },
}