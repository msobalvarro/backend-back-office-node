const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../../logs/write.config')
const _ = require("lodash")

// Email Api and Email from Constant
const sendEmail = require("../../configuration/send-email.config")
const { getHTML } = require("../../configuration/html.config")
const { EMAILS } = require("../../configuration/constant.config")

// Sql transaction
const sql = require("../../configuration/sql.config")
const { getAllRequest, getRequestDetails, declineRequest, acceptRequest, getRequestInvestmentDetails } = require("../../configuration/queries.sql")


/**
 * Funcion que ejecuta el envio de correo para notificar
 * al inversor 
 * */
const senMailAccept = (data = {}, hash = "") => new Promise(async (resolve, reject) => {
    try {
        // creamos constante que decide el simbolo de la moneda
        const typeCoin = data.id_currency === 1 ? "BTC" : "ETH"

        // Verificamos si enviamos un email a su sponsor
        if (data.sponsor_email) {

            // indica el porcentaje
            const percentage = 5;

            // creamos la configuracion de las plantilla con los datos indicados
            const html = await getHTML("comission-sponsor.html", {
                name: data.name,
                sponsorName: data.sponsor_name,
                percentage,
                amountSponsor: _.floor((data.amount * percentage), 8),
                typeCoin,
                totalAmount: data.amount,
                hash
            })

            // creamos la configuracion del correo
            const msgSponsor = {
                to: data.sponsor_email,
                from: EMAILS.DASHBOARD,
                subject: `Comision por Referido`,
                html
            }

            await sendEmail(msgSponsor)
        }

        // creamos la plantilla de correo 
        // para notificar al inversor que su plan ha sido activado
        const html = await getHTML("investment-received.html", { name: data.name, amount: data.amount, typeCoin })

        // creamos las configuraciones para el envio del correo
        const msgInvestor = {
            to: data.email,
            from: EMAILS.DASHBOARD,
            subject: `Plan de Inversion en ${data.id_currency === 1 ? "Bitcoin" : "Ethereum"}`,
            html,
        }

        await sendEmail(msgInvestor)


        resolve()
    } catch (error) {
        reject(error)
    }
})

/**
 * Controlador que enlista todas las solicitudes de compras de planes
 */
router.get('/', async (_, res) => {
    try {
        const response = await sql.run(getAllRequest)

        res.status(200).send(response[0])
    } catch (error) {
        /**Error information */
        WriteError(`request.admin.controller.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})


/**
 * Controlador `OBSOLETO`
 */
router.post('/id', [check('id', 'ID is not valid').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { id } = req.body

        const response = await sql.run(getRequestDetails, [id])

        res.status(200).send(response[0][0])

    } catch (error) {
        /**Error information */
        WriteError(`request.admin.controller.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**
 * Controlador que retorna la informacion detallada de la solictud de acivacion de plan
 */
router.get('/details/:id', async (req, res) => {
    try {
        const { id } = req.params

        // Convertimos el id del plan en un entero
        const id_investment = parseInt(id)

        // verificamos si el id del plan es correcto/incorrectp
        if (isNaN(id_investment)) {
            throw String("Ciertos datos no se encontraron")
        }

        // ejecutamos
        const response = await sql.run(getRequestInvestmentDetails, [id])

        res.status(200).send(response[0])

    } catch (error) {
        /**Error information */
        WriteError(`request.admin.controller.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**
 * Controlador que ejcuta el rechazo de un plan de inversion
 */
router.delete('/decline', [check('id', 'ID is not valid').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id } = req.body

        await sql.run(declineRequest, [id])

        res.status(200).send({ response: 'success' })

    } catch (error) {
        /**Error information */
        WriteError(`request.admin.controller.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**
 * Controlador que ejecuta la aceptacion solitud de plan de inversion
 */
router.post('/accept', [check('data', 'data is not valid').exists()],
    async (req, res) => {
        try {
            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                throw String(errors.array()[0].msg)
            }

            const { data, hashSponsor } = req.body

            // Verificamos si envia el hash de transaccion
            // Esto siempre y cuando haya un sponsor
            if (data.sponsor_name !== null && hashSponsor.length === 0) {
                throw String("El hash de sponsor es requerido")
            }

            // generamos la consulta para aceptar
            await sql.run(acceptRequest, [data.id])

            // enviamos los correos requridos
            await senMailAccept(data, hashSponsor)

            res.send({ response: "success" })

        } catch (error) {
            /**Error information */
            WriteError(`request.admin.controller.js - catch execute sql | ${error}`)

            const response = {
                error: true,
                message: error
            }

            res.send(response)
        }
    })

module.exports = router
