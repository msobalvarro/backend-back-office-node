const express = require('express')
const router = express.Router()
if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const { CAPTCHAKEY } = process.env
const captcha = require("express-recaptcha").RecaptchaV2
const { generatePin } = require("secure-pin")
const validator = require("validator")

/**
 * Constante que guarda el captcha public key
 */
const publicKey = "6LeTe60ZAAAAAOcLmLZ-I_EXmH1PhQwmw4Td6e3D"

const recaptcha = new captcha(publicKey, CAPTCHAKEY)

const ERRROS = {
    EMAIL: "El correo no es correcto",
    PIN: "El pin no es correcto",
    CAPTCHA: "reCaptcha no valido, intente mas tarde"
}

// recaptcha.middleware.verify
router.post("/generate", (req, res) => {
    try {
        const { email, pin } = req.body

        console.log(email, pin)

        if (!validator.isEmail(email)) {
            throw ERRROS.EMAIL
        }

        if (!validator.isInt(pin.toString())) {
            throw ERRROS.PIN
        }

        generatePin(6, (pinGenerated) => {
            res.send({ pin: pinGenerated })
        })

        // if (req.recaptcha.error) {
        //     throw ERRROS.CAPTCHA
        // }
    } catch (error) {
        res.send({ error: true, message: error.toString() })
    }
})

module.exports = router