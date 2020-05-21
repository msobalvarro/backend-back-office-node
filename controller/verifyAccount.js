const express = require('express')
const router = express.Router()
const moment = require('moment')
const WriteError = require('../logs/write')

if (process.env.NODE_ENV !== 'production') require('dotenv').config()
const { JWTSECRET } = process.env

// Mysql
const query = require('../config/query')
const { activateAccount } = require('./queries')

/**Url al dashboard */
const urlDashboard = "https://dashboard-speedtradings-bank.herokuapp.com"

/**Planatilla cuando el tiempo de activacion ha cadicado */
const templateTimeOut = `
    <h1 style="color: red;">El tiempo de activacion ha caducado, contacte a soporte</h1>

    <p>
        <a href="mailto:tradingspeed4@gmail.com">Haz click para redirigirte a soporte</a> - <a href="${urlDashboard}">ir a dashboard</a>
    </p>
`

/**Plantilla cuando el usuario es verificado */
const templateSuccess = `
    <h1 style="color: green;">Su cuenta ha sido activada, en unos momentos sera redirigido..</h1>

    <span>cargando..</span>


    <script>
        setTimeout(function () {
            window.location = "${urlDashboard}"
        }, 5000)
    </script>
`

router.post('/', (re, res) => res.send(500))

router.get('/', (req, res) => {
    try {
        // Obtenemos el url encryptado
        const { id } = req.query

        // Desencrytamos el url como parametr
        const dataDecrypt = Buffer.from(id, "base64").toString()

        // Creamos el json apartir de un `STRING`
        const objectData = JSON.parse(dataDecrypt)

        // Seleccionamos los parametros que trae
        const { time, username, ip } = objectData

        const clients = req.app.get('clients')


        // Verificamos si el json tiene el formato valido
        if (time && username && ip) {
            const diferenceTime = moment.duration(moment(time).diff(moment()))

            // Verificamos si esta en el rango de tiempo de activacion (24 hora)
            if (diferenceTime.get("hours") >= -24) {
                const querySelectUser = "select enabled from users where username = ?"

                // Verificamos si el usuario ya esta activo 
                query(querySelectUser, [username], (result) => {
                    const enabled = result[0].enabled

                    // Si esta activo mostramos el template de tiempo caducado
                    if (enabled === 1) {
                        res.send(templateTimeOut)
                    } else {
                        // Ejecutamos la query de activacion
                        query(activateAccount, [username], async () => {
                            if (clients) {
                                clients.forEach(async (client) => {
                                    await client.send("newRequest")
                                })
                            }

                            res.send(templateSuccess)

                        })
                    }
                })

            } else {
                res.send(templateTimeOut)
            }
        }

    } catch (error) {
        WriteError(`verifyAccount.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

module.exports = router