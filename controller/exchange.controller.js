const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const { EMAILS, socketAdmin, eventSocketNames } = require("../configuration/constant.config")

// Auth by token and middlewares
const { authRoot } = require('../middleware/auth.middleware')
const { bitcoin, ethereum, litecoin, dash } = require("../middleware/hash.middleware")

// Email api
const sendEmail = require("../configuration/send-email.config")


// Logs controller
const log = require('../logs/write.config')

// mysql
const { createRequestExchange, getAllExchange, setDeclineExchange, acceptRequestExchange, searchHash } = require("../configuration/queries.sql")
const sql = require("../configuration/sql.config")

/**Funcion que ejecuta el envio de correo al rechazar una solicitud de intercambio */
const sendEmailByDecline = async (dataArgs = {}, reason = "") => {
    const config = {
        to: dataArgs.email,
        from: EMAILS.EXCHANGE,
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
                Le informamos que su compra de ${dataArgs.request_currency} fue rechazada
            </p>

            <div
                style="padding: 25px; background-color: rgba(0, 0, 0, 0.2); margin-top: 10px; border-radius: 10px; font-size: 18px; color: #232e40;">
                <p style="text-transform: uppercase;">
                    <b>Motivo: </b> ${reason}
                </p>
            </div>

            <br />

            <p style="color: #232e40; font-size: 24px; font-weight: lighter;">Saludos, Equipo AlySystem..</p>
        </div>
        `,
    }

    await sendEmail(config)
}

/**Funcion que ejecuta el envio de correo al aceptar una solicitud de intercambio */
const sendEmailByAccept = async (dataArgs = {}, hash = "") => {
    const config = {
        to: dataArgs.email,
        from: EMAILS.EXCHANGE,
        subject: `Compra de ${dataArgs.request_currency}`,
        html: `
        <div
            style="background: #FFF; padding: 25px; color: #000; font-size: 1.2em; font-family: Arial, Helvetica, sans-serif; text-align: center; height: 100%;">
            <a href="https://www.speedtradings.com/">
                <img width="512" height="384"
                    src="https://lh3.googleusercontent.com/mFIjQtjbarGISCnIqDl1UHDHpyelc4YFHBQ_hCTbxua12udujrjtFwHsYOvbX169IvVvYilySxL2eOCv64uvVQhBtxISzjrzgC3hrNjArcPn2dCAT5cREG4eYC1OTrqNLeJVbNm_kLRMMBWLOpz3AzBesW1tQktOxPt89dRjN-OFkD1vkw0lKgZGGbPnJ4w1cHY6CLigiS3U3mwM0coNooN5sl529dwvDpgOw5d-_wPnOj1B2YMdQ_eELVMFCXj47q4PV0JyJgyglNvUaaFlYmOKAQ2YQtvzAJTo6plhRH5v2nIsfSdR2rz3Hpaou8nEmQm-8i7yJADEuzhTH-Ts0SJmyT3G7m5oSXgV1acTArQ9c3xtuRyqcBOaTa_9Zzulm3Vh327YTUc590Y6DJ1vgGBl90-3H1D5kEcMsfH6hBetKegXkUOFWsF_vqwINq-UBDWh7m245Vq-tm4LtSd8iAvzQtk0O-tvBY-qDef4VtWxylyenQTvjYPZVggUjtlWmDBqMOPbtrc7aoZDpJQ9ETpSpnZsD-v1CVKLml-jw22YUKYyt9g3hULllQMBJdPl0liE30Iur2NPoDJZGyid8GOYZaZBMUwhXrWU1lfATwvYMMQwzvzQOhpvgAv7QiXy0vRc1dgLjXBEiitjtq3TUg3eDWSyaqq6eY7qw93cqZMNku2LV2CM4yZCtyRaNm3crll9Ew=w1600-h780-ft" />
            </a>

            <br />

            <p style="color: #176294; font-size: 24px;">
                Le informamos que su compra de ${dataArgs.request_currency} con valor de ${dataArgs.amount} ${dataArgs.currency} se ejecuto exitosamente
            </p>

            <div
                style="padding: 25px; background-color: rgba(0, 0, 0, 0.2); margin-top: 10px; border-radius: 10px; font-size: 18px; color: #232e40;">
                <p style="text-transform: uppercase;">
                    <b>hash de transaccion: </b> ${hash}
                </p>
            </div>

            <br />

            <p style="color: #232e40; font-size: 24px; font-weight: lighter;">Saludos, Equipo AlySystem..</p>
        </div>
        `,
    }

    await sendEmail(config)
}

const checkDataAccept = [authRoot]

router.get("/", checkDataAccept, async (_, res) => {
    try {
        const response = await sql.run(getAllExchange)

        res.send(response)
    } catch (error) {
        log(`exchange.js - ${error.toString()}`)

        res.send({ error: true, message: error.toString() })
    }
})

const checkDataDecline = [authRoot, [
    check("reason", "La razon del rechazon es requerida").exists(),
    check("exchange", "exchange is requerid").exists()
]]

/**Controlador que ejecuta la accion de rechazar */
router.post("/decline", checkDataDecline, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
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

        // // guardamos el registro
        await sql.run(setDeclineExchange, [exchange.id, reason])

        // // enviamos una notificacion al cliente
        await sendEmailByDecline(exchange, reason)

        // enviamos notificacion socket
        socketAdmin.emit(eventSocketNames.removeExchange, exchange.id)

        res.send({ response: "success" })

    } catch (error) {
        log(`exchange.js - ${error.toString()}`)

        res.send({ error: true, message: error.toString() })
    }
})

const checkDataAcceptRequest = [authRoot, [
    check("hash", "Hash de transaccion requerida").exists(),
    check("exchange", "exchange is requerid").exists()
]]

/**Controlador que ejecuta la accion de aceptar un exchange */
router.post("/accept", checkDataAcceptRequest, async (req, res) => {
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
        const { hash, exchange } = req.body

        // ejecutamos la consulta para registra
        await sql.run(acceptRequestExchange, [exchange.id, hash])

        // enviamos una notificacion al correo 
        await sendEmailByAccept(exchange, hash)

        // enviamos notificacion socket
        socketAdmin.emit(eventSocketNames.removeExchange, exchange.id)

        res.send({ response: "success" })

    } catch (error) {
        log(`exchange.js - ${error.toString()}`)

        res.send({ error: true, message: error.toString() })
    }
})


const checkDataRequest = [
    check("currency", "Currency is required").exists(),
    check("hash", "Hash is required").exists(),
    check("amount", "Amount is invalid").exists().isFloat(),
    check("request_currency", "Request currency is required").exists(),
    check("approximate_amount", "Approximate amount is invalid").exists().isFloat(),
    check("wallet", "Wallet is required").exists(),
    check("coin_price", "Coin price is required").isFloat().exists(),
    check("email", "Email is required").exists().isEmail(),
]

/**Controlador que ejecuta una solicitud de exchanger */
router.post("/request", checkDataRequest, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { currency, hash, amount, request_currency, approximate_amount, wallet, label, memo, email, coin_price } = req.body

        // Ejecutamos consulta para revisar si el hash ya existe en la base de datos
        const responseDataSearchHash = await sql.run(searchHash, [hash])

        // verificamos si el hash existe
        if (responseDataSearchHash[0].length > 0) {
            throw String("El hash ya esta registrado")
        }

        // Almacena que tipo de moneda vendera el usuario
        const buyCurrency = currency.toLowerCase()

        let responseHash = null

        // Validamos si la venta de moneda es `btc` o `eth`
        switch (buyCurrency) {
            case "bitcoin":
                // Verificamos el hash con blockchain
                responseHash = await bitcoin(hash, amount)

                if (responseHash.error) {
                    throw responseHash.message
                }

                break

            case "ethereum":
                // Verificamos el hash con blockchain
                responseHash = await ethereum(hash, amount)

                if (responseHash.error) {
                    throw responseHash.message
                }

                break

            case "litecoin":
                // Verificamos el hash con blockchain
                responseHash = await litecoin(hash, amount)

                if (responseHash.error) {
                    throw responseHash.message
                }

                break

            case "dash":
                // Verificamos el hash con blockchain
                responseHash = await dash(hash, amount)

                if (responseHash.error) {
                    throw responseHash.message
                }

                break
        }

        // Ejecutamos la solicitud
        await sql.run(createRequestExchange, [currency, coin_price, hash, amount, request_currency, approximate_amount, wallet, label, memo, email])

        // enviamos notificacion socket
        socketAdmin.emit(eventSocketNames.newExchange)

        res.send({ response: "success" })
    } catch (error) {
        log(`exchange.js - ${error.toString()}`)

        res.send({ error: true, message: error.toString() })
    }
})

module.exports = router