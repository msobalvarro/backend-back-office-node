const express = require('express')
const router = express.Router()

// Import enviroment
const { CAPTCHAKEY, JWTSECRET } = require("../configuration/vars.config")

// Import pin security
const { generatePin } = require("secure-pin")

// Import middleware
const validator = require("validator")
const captcha = require("express-recaptcha").RecaptchaV2

// Import sql and mysql configuration
const { changePassword, getInfoUser, getUser, insertPinSecurity, getInfoPin, getInfoPinActive } = require("../configuration/queries.sql")
const mysql = require("../configuration/sql.config")


// Import send email confuration
const { getHTML } = require("../configuration/html.config")
const sendEmail = require("../configuration/send-email.config")

// Import constant and functions
const { EMAILS } = require("../configuration/constant.config")
const crypto = require('crypto-js')

/**
 * Constante que guarda el captcha public key
 */
const publicKey = "6LeTe60ZAAAAAOcLmLZ-I_EXmH1PhQwmw4Td6e3D"

const recaptcha = new captcha(publicKey, CAPTCHAKEY)

const ERRORS = {
    EMAIL: "El correo no es correcto",
    PIN: "El pin no es correcto",
    CAPTCHA: "Captcha no valido, intente mas tarde"
}

// Controlador para generar el ping de seguridad
router.post("/generate", async (req, res) => {
    try {
        const { email } = req.body

        // Verificamos si el correo es un correo
        if (!validator.isEmail(email)) {
            throw ERRORS.EMAIL
        }

        /**
         * constante que guardara la informacion del usuario
         */
        const informationUser = await mysql.run(getInfoUser, [email])

        // Verificamos si el correo esta asociado
        if (informationUser.length === 0) {
            throw "El correo no esta asociado a Speed Tradings"
        }


        /**
         * Variable que tendra el pin de seguridad
         */
        let pin = 0

        generatePin(6, async (newPin) => {
            pin = parseInt(newPin)
        })

        // Obtenemos los datos necesarios del usuario
        const { id, firstname: name } = informationUser[0]

        // Obtenemos la informacion del usuario
        const tableUser = await mysql.run(getUser, [id])

        // Verificamos si el usuario existe
        if (tableUser.length === 0) {
            throw "El usuario no existe, contacte a soporte"
        }

        // Obtenemos alguna informacion de este correo (si hay un cambio de password pendiente)
        const infoPin = await mysql.run(getInfoPinActive, [tableUser[0].id])

        // Verificamos si no hay un proceso de cambio de password activo
        if (infoPin.length !== 0) {
            throw String("Ya existe un pin de seguridad generado, revise su correo o contacte a soporte")
        }

        // Contruimos la plantilla del correo
        const html = await getHTML("reset-password.html", { pin, name })

        /**Parametros para insertar los datos a password_reset */
        const paramsInsertPin = [tableUser[0].id, pin, new Date()]

        // Ingresamos el pin de seguridad a la base de datos
        await mysql.run(insertPinSecurity, paramsInsertPin)

        // Enviamos el correo de pin
        sendEmail({ from: EMAILS.DASHBOARD, to: email, subject: "Password change request", html })

        res.send({ response: "success" })

    } catch (error) {
        res.send({ error: true, message: error.toString() })
    }
})

// Controlador para comprobar el pin 
// recaptcha.middleware.verify
router.post("/pin", recaptcha.middleware.verify, async (req, res) => {
    try {
        const { pin, password } = req.body

        if (req.recaptcha.error) {
            throw ERRORS.CAPTCHA
        }

        // Validamos si el pin code es de formato numerico
        if (!validator.isInt(pin.toString())) {
            throw ERRORS.PIN
        }

        // Validamos si el ping es de seis digitos
        if (pin.toString().length !== 6) {
            throw "El pin de seguridad no tiene un formato correcto"
        }

        // Obtenemos la informacion de cambio de password
        const dataPin = await mysql.run(getInfoPin, [parseInt(pin)])

        // Verificamos el pin
        if (dataPin.length === 0) {
            throw ERRORS.PIN
        }

        const passwordEncrypt = crypto.SHA256(password, JWTSECRET).toString()

        const paramsSQL = [pin, dataPin[0].id_user, passwordEncrypt]

        await mysql.run(changePassword, paramsSQL)

        res.send({ response: "success" })

    } catch (error) {
        res.send({ error: true, message: error.toString() })
    }
})

module.exports = router