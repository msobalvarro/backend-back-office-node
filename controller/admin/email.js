const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Emaisl Api Config
const sendEmail = require("../../config/sendEmail")
const { EMAILS } = require("../../config/constant")

if (process.env.NODE_ENV !== 'production') require('dotenv').config()

// Mysql
const { getEMails } = require("../queries")
const query = require("../../config/query")

router.get("/all", (req, res) => {
    try {
        query(getEMails, [], response => {
            res.send(response)
        })
    } catch (error) {
        res.send({
            error: true,
            message: error.toString()
        })
    }
})

const checkApiSend = [
    check("emails", "emails is required").isArray(),
    check("subject", "subject is required").exists(),
    check("html", "data email is required").exists(),
]


router.post("/send", checkApiSend, async (req, res) => {
    const errors = validationResult(req)

    // Verificamos si hay un error en las variables recibidas
    if (!errors.isEmpty()) {
        return res.send({
            error: true,
            message: errors.array()[0].msg
        })
    }

    // Guardamos los parametros
    const { emails, subject, html } = req.body

    /**Metodo para enviar los correos automaticos */

    // Recorreremos todos los correos recibidos para enviarles el mensaje
    // uno por uno
    await emails.map(async (to = "") => {
        const config = {
            to,
            from: EMAILS.MANAGEMENT,
            subject,
            html,
        }

        await sendEmail(config)
    })

    // Enviaremos un mensaje de respuesta
    res.send({ response: "success" })
})

module.exports = router