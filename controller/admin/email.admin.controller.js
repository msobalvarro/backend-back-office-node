const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Emaisl Api Config
const sendEmail = require("../../configuration/send-email.config")
const { getHTML } = require("../../configuration/html.config")

// Mysql
const { getEMails } = require("../../configuration/queries.sql")
const sql = require("../../configuration/sql.config")

router.get("/all", async (_, res) => {
    try {
        const response = await sql.run(getEMails)

        res.send(response)
    } catch (error) {
        res.send({
            error: true,
            message: error.toString()
        })
    }
})

const checkApiSend = [
    check("emails", "emails is required").isArray(),
    check("sender", "sender is required").exists(),
    check("subject", "subject is required").exists(),
    check("html", "data email is required").exists(),
]


router.post("/send", checkApiSend, async (req, res) => {
    const errors = validationResult(req)

    // Verificamos si hay un error en las variables recibidas
    if (!errors.isEmpty()) {
        throw String(errors.array()[0].msg)
    }

    // Guardamos los parametros
    const { emails, sender, subject, html } = req.body

    // Se carga el template y se le añade el contenido del correo recibido
    const _html = await getHTML("send-email.html", { body: html })

    /**Metodo para enviar los correos automaticos */
    // Recorreremos todos los correos recibidos para enviarles el mensaje
    // uno por uno
    await emails.map(async (to = "") => {
        const config = {
            to,
            from: sender,
            subject,
            html: _html
        }

        await sendEmail(config)
    })

    // Enviaremos un mensaje de respuesta
    res.send({ response: "success"})
})

module.exports = router