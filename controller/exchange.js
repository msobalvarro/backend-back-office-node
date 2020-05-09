const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')

// Auth by token
const auth = require('../middleware/auth')

// Email api
const sgMail = require('@sendgrid/mail')

if (process.env.NODE_ENV !== 'production') require('dotenv').config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY)


// Logs controller
const WriteError = require('../logs/write')

// mysql
const { createRequestExchange, getAllExchange, setDeclineExchange } = require("../controller/queries")
const query = require("../config/query")

/**Funcion que ejecuta el envio de correo al rechazar una solicitud de intercambio */
const sendEmailByDecline = async (dataArgs = {}, reason = "") => {
    const msg = {
        to: dataArgs.email,
        from: 'alyExchange@speedtradings.com',
        subject: `Compra de ${dataArgs.request_currency} rechazada`,
        html: `
        <div
            style="background: #FFF; padding: 25px; color: #000; font-size: 1.2em; font-family: Arial, Helvetica, sans-serif; text-align: center; height: 100%;">
            <a href="https://www.speedtradings.com/">
                <img width="512" height="384"
                    src="https://lh3.googleusercontent.com/mFIjQtjbarGISCnIqDl1UHDHpyelc4YFHBQ_hCTbxua12udujrjtFwHsYOvbX169IvVvYilySxL2eOCv64uvVQhBtxISzjrzgC3hrNjArcPn2dCAT5cREG4eYC1OTrqNLeJVbNm_kLRMMBWLOpz3AzBesW1tQktOxPt89dRjN-OFkD1vkw0lKgZGGbPnJ4w1cHY6CLigiS3U3mwM0coNooN5sl529dwvDpgOw5d-_wPnOj1B2YMdQ_eELVMFCXj47q4PV0JyJgyglNvUaaFlYmOKAQ2YQtvzAJTo6plhRH5v2nIsfSdR2rz3Hpaou8nEmQm-8i7yJADEuzhTH-Ts0SJmyT3G7m5oSXgV1acTArQ9c3xtuRyqcBOaTa_9Zzulm3Vh327YTUc590Y6DJ1vgGBl90-3H1D5kEcMsfH6hBetKegXkUOFWsF_vqwINq-UBDWh7m245Vq-tm4LtSd8iAvzQtk0O-tvBY-qDef4VtWxylyenQTvjYPZVggUjtlWmDBqMOPbtrc7aoZDpJQ9ETpSpnZsD-v1CVKLml-jw22YUKYyt9g3hULllQMBJdPl0liE30Iur2NPoDJZGyid8GOYZaZBMUwhXrWU1lfATwvYMMQwzvzQOhpvgAv7QiXy0vRc1dgLjXBEiitjtq3TUg3eDWSyaqq6eY7qw93cqZMNku2LV2CM4yZCtyRaNm3crll9Ew=w1600-h780-ft" />
            </a>

            <br />

            <p style="color:  rgb(117, 28, 28); font-size: 24px;">
                Le informamos que su compra de ${dataArgs.amount} ${dataArgs.currency} fue rechazada
            </p>

            <div
                style="padding: 25px; background-color: rgba(0, 0, 0, 0.2); margin-top: 10px; border-radius: 10px; font-size: 18px; color: #232e40;">
                <p style="text-transform: uppercase;">
                    <b>Razon: </b> ${reason}
                </p>
            </div>

            <br />

            <p style="color: #232e40; font-size: 24px; font-weight: lighter;">Saludos, Equipo de Speed Tradings Bank.</p>
        </div>
        `,
    }

    await sgMail.send(msg).catch(err => new Error(err))
}

const checkDataAccept = [auth]

router.get("/", checkDataAccept, (req, res) => {
    try {
        query(getAllExchange, [], (response) => {
            res.send(response)
        })
    } catch (error) {
        WriteError(`exchange.js - ${error.toString()}`)

        return res.json({ error: true, message: error.toString() })
    }
})

const checDataDecline = [auth, [
    check("reason", "La razon del rechazon es requerida").exists(),
    check("exchange", "exchange is requerid").exists()
]]

router.post("/decline", checDataDecline, (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw errors.array()[0].msg
        }

        /**
         * 
         * Argumentos que obtenemos de `exchange`
         * 
         * * id
         * * date
         * * currency
         * * hash
         * * amount
         * * request_currency
         * * approximate_amount
         * * wallet
         * * label
         * * memo
         * * email
         * * accept
         *   
         */
        const { reason, exchange } = req.body

        query(setDeclineExchange, [exchange.id, reason], async () => {
            await sendEmailByDecline(exchange, reason)

            res.send({ response: "success" })
        })

    } catch (error) {
        WriteError(`exchange.js - ${error.toString()}`)

        return res.json({ error: true, message: error.toString() })
    }
})

const checkDataRequest = [
    check("currency", "Currency is required").exists(),
    check("hash", "Hash is required").exists(),
    check("amount", "Amount is invalid").exists().isFloat(),
    check("request_currency", "Request currency is required").exists(),
    check("approximate_amount", "Approximate amount is invalid").exists().isFloat(),
    check("wallet", "Wallet is required").exists(),
    check("email", "Email is required").exists().isEmail(),
]

router.post("/request", checkDataRequest, (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw errors.array()[0].msg
        }

        const { currency, hash, amount, request_currency, approximate_amount, wallet, label, memo, email } = req.body

        query(createRequestExchange, [currency, hash, amount, request_currency, approximate_amount, wallet, label, memo, email], () => {
            res.send({ response: "success" })
        }).catch(reason => {
            throw "ha ocurrido un error en la solicitud"
        })

    } catch (error) {
        WriteError(`exchange.js - ${error.toString()}`)

        return res.json({ error: true, message: error.toString() })
    }
})

module.exports = router