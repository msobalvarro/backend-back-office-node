const express = require('express')
const router = express.Router()

// Import enviroment
if (process.env.NODE_ENV !== 'production') require('dotenv').config()
const { CAPTCHAKEY, JWTSECRET } = process.env

// Import pin security
const { generatePin } = require("secure-pin")

// Import middleware
const validator = require("validator")
const captcha = require("express-recaptcha").RecaptchaV2

// Import query and mysql configuration
const { changePassword, getInfoUser, getUser, insertPinSecurity, getInfoPin, getInfoPinActive } = require("../config/queries")
const mysql = require("../config/query")


// Import send email confuration
const { getHTML } = require("../config/html")
const sendEmail = require("../config/sendEmail")

// Import constant and functions
const { EMAILS } = require("../config/constant")
const crypto = require('crypto-js')

/**
 * Constante que guarda el captcha public key
 */
const publicKey = "6LeTe60ZAAAAAOcLmLZ-I_EXmH1PhQwmw4Td6e3D"

const recaptcha = new captcha(publicKey, CAPTCHAKEY)

const ERRORS = {
    EMAIL: "El correo no es correcto",
    PIN: "El pin no es correcto",
    CAPTCHA: "reCaptcha no valido, intente mas tarde"
}

// recaptcha.middleware.verify
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
        const informationUser = await mysql.withPromises(getInfoUser, [email])

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
        const tableUser = await mysql.withPromises(getUser, [id])

        // Verificamos si el usuario existe
        if (tableUser.length === 0) {
            throw "El usuario no existe, contacte a soporte"
        }

        // Obtenemos alguna informacion de este correo (si hay un cambio de password pendiente)
        const infoPin = await mysql.withPromises(getInfoPinActive, [tableUser[0].id])

        // Verificamos si no hay un proceso de cambio de password activo
        if (infoPin.length !== 0) {
            throw "Ya existe un pin de seguridad generado, revise su correo o contacte a soporte"
        }

        // Contruimos la plantilla del correo
        const html = await getHTML("reset-password.html", { pin, name })

        /**Parametros para insertar los datos a password_reset */
        const paramsInsertPin = [tableUser[0].id, pin, new Date()]

        console.log(paramsInsertPin)

        // Ingresamos el pin de seguridad a la base de datos
        await mysql.withPromises(insertPinSecurity, paramsInsertPin)

        // Enviamos el correo de pin
        sendEmail({ from: EMAILS.DASHBOARD, to: email, subject: "Password change request", html })

        res.send({ response: "success" })

        // if (req.recaptcha.error) {
        //     throw ERRROS.CAPTCHA
        // }
    } catch (error) {
        res.send({ error: true, message: error.toString() })
    }
})

// Controlador para comprobar el pin 
router.post("/pin", async (req, res) => {
    try {
        const { pin, password } = req.body

        // Validamos si el pin code es de formato numerico
        if (!validator.isInt(pin.toString())) {
            throw ERRORS.PIN
        }

        // Validamos si el ping es de seis digitos
        if (pin.toString().length !== 6) {
            throw "El pin de seguridad no tiene un formato correcto"
        }

        // Obtenemos la informacion de cambio de password
        const dataPin = await mysql.withPromises(getInfoPin, [parseInt(pin)])

        // Verificamos el pin
        if (dataPin.length === 0) {
            throw ERRORS.PIN
        }

        const passwordEncrypt = crypto.SHA256(password, JWTSECRET).toString()

        const paramsSQL = [pin, dataPin[0].id_user, passwordEncrypt]

        await mysql.withPromises(changePassword, paramsSQL)

        res.send({ response: "success" })

    } catch (error) {
        res.send({ error: true, message: error.toString() })
    }
})

module.exports = router