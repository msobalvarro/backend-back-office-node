const express = require('express')
const router = express.Router()
const moment = require('moment')
const log = require('../logs/write.config')

// import constanst and functions
const { socketAdmin, eventSocketNames } = require("../configuration/constant.config")

const { getHTML } = require("../configuration/html.config")

// Mysql
const query = require('../configuration/sql.config')
const { activateAccount } = require('../configuration/queries.sql')

router.get('/', async (req, res) => {
    try {
        // Obtenemos el url encryptado
        const { id } = req.query

        // Desencrytamos el url como parametr
        const dataDecrypt = Buffer.from(id, "base64").toString()

        // Creamos el json apartir de un `STRING`
        const objectData = JSON.parse(dataDecrypt)

        // Seleccionamos los parametros que trae
        const { time, username, ip } = objectData

        /**Planatilla cuando el tiempo de activacion ha cadicado */
        const templateTimeOut = await getHTML("error-server.html", { code: 401, message: "El tiempo de activacion ha caducado, contacte a soporte" })

        // Verificamos si el json tiene el formato valido
        if (time && username && ip) {
            const diferenceTime = moment.duration(moment(time).diff(moment()))

            // Verificamos si esta en el rango de tiempo de activacion (24 hora)
            if (diferenceTime.get("hours") >= -24) {
                const querySelectUser = "select enabled from users where username = ?"

                // Verificamos si el usuario ya esta activo 
                const result = await query.run(querySelectUser, [username])

                const enabled = result[0].enabled

                // Si esta activo mostramos el template de tiempo caducado
                if (enabled === 1) {
                    res.send(templateTimeOut)
                } else {
                    // Ejecutamos la query de activacion
                    await query.run(activateAccount, [username])

                    // enviamos notificacion socket
                    socketAdmin.emit(eventSocketNames.newRegister)

                    /**Plantilla cuando el usuario es verificado */
                    const templateSuccess = await getHTML("verify-account.html")

                    res.send(templateSuccess)
                }

            } else {
                res.send(templateTimeOut)
            }
        }

    } catch (error) {
        log(`verifyAccount.controller.js - catch execute query | ${error}`)

        /**Planatilla cuando el tiempo de activacion ha cadicado */
        const template = await getHTML("error-server.html", { 
            code: 500, 
            message: error.toString()
        })
        
        res.send(template)
    }
})

module.exports = router