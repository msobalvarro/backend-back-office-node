const express = require('express')
const router = express.Router()

// import middleware
const { check, validationResult } = require('express-validator')

// import constants and functions
const { ALYHTTP, NOW } = require("../../configuration/constant.config")
const moment = require("moment")
const WriteError = require('../../logs/write.config')

// Emails APIS and from email
const sendEmail = require("../../configuration/send-email.config")
const { EMAILS } = require("../../configuration/constant.config")
const { PRODUCTION, PORT } = require("../../configuration/vars.config")
const { getHTML } = require("../../configuration/html.config")

// Sql transaction
const sql = require("../../configuration/sql.config")
const { getAllPayments, createWithdrawals } = require("../../configuration/queries.sql")
const { default: Axios } = require('axios')

const sendEmailWithdrawals = async (email = "", name = "", amount = 0, currency = "BTC", hash = "", percentage = 0) => {
    const html = await getHTML("payment.html", { name, amount, currency, hash, percentage })

    const config = {
        to: email,
        from: EMAILS.MANAGEMENT,
        subject: `Informe de pago - ${moment(NOW()).format('"DD-MM-YYYY"')}`,
        html
    }

    await sendEmail(config)
}

router.get('/:id_currency', async (req, res) => {
    const errors = validationResult(req)

    try {
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { id_currency } = req.params

        if (!id_currency) {
            throw String("Error en procesar la moneda")
        }

        const dataSQL = await sql.run(getAllPayments, [parseInt(id_currency)])

        res.status(200).send(dataSQL[0])

    } catch (error) {
        /**Error information */
        WriteError(`report-payments.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }

})

const checkParamsApplyReport = [
    check("data", "Los datos del reporte son requeridos").isArray().exists(),
    check("id_currency", "El id de la moneda no es correcto").isInt().exists()
]

router.post("/apply", checkParamsApplyReport, async (req, res) => {
    const errors = validationResult(req)

    try {
        // verificamos si no hay error en los parametros
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Obtenemos los parametros recibidos por el back office
        const { data, id_currency } = req.body

        // verificamos el simbolo de la moneda
        const currency = id_currency === 1 ? "BTC" : "ETH"

        // Ejecutamos la peticion al server de todas mis wallets
        const { data: dataWallet } = await ALYHTTP.get("/wallet")

        /// verificamos si hay un error 
        if (dataWallet.error) {
            throw String(dataWallet.message)
        }


        // recorremos todo los reportes de pago
        for (let i = 0; i < data.length; i++) {
            /**
             * item object:
             * * id_investment: `INT`
             * * amount: `FLOAT`
             * * name: `STRING`
             * * email: `STRING`
             * * hash: `STRING`
             * alypay: `INT`
             */
            const { id_investment, hash, amount, name, email, alypay, wallet } = data[i]

            // verificamos si el formato de parameetro alypay es correcto 
            if (alypay !== 0 && alypay !== 1) {
                throw String(`Formato de paramtro AlyPay no es correcto ${alypay} `)
            }

            // validamos el id del plan
            if (id_investment === undefined || id_investment === null) {
                throw String(`El proceso de pago se ha detenido porque el de ${name} no se ha encontrado en la base de datos`)
            }

            // verificamos si el pago es atravez de alypay
            // verificamos si no hay hash de transaccion previo
            if (alypay === 1 && hash === "") {
                console.log(`Pagando con alypay a ${name}`)

                // filtramos la  billetera de gerencia
                const dataWalletClient = dataWallet.filter(x => x.symbol === currency)

                // verificamos si no encontramos la billetera seleccionada BTC/ETH
                if (dataWalletClient.length === 0) {
                    throw String("No se ha encontrado la billetera de AlyPay")
                }

                // variables que se enviaran a una peticion
                const vars = {
                    amount_usd: (dataWalletClient[0].price * amount),
                    amount: amount,
                    id_wallet: dataWalletClient[0].id,
                    wallet: wallet.trim(),
                    symbol: dataWalletClient[0].symbol,
                }

                // ejecutamos el api para la transaccion
                const { data: dataTransaction } = await ALYHTTP.post("/wallet/transaction", vars)

                // verificamos si hay error en la transaccion alypay
                if (dataTransaction.error) {
                    throw String(dataTransaction.message, name)
                }

                // // ejecutamos el reporte de pago en la base de datos
                // const responseSQL = await sql.run(createWithdrawals, [id_investment, dataTransaction.hash, amount, alypay])

                // // obtenemos el porcentaje de ganancia
                // const { percentage } = responseSQL[0][0]

                // // envio de correo
                // sendEmailWithdrawals(email, name, amount, currency, hash, percentage)
            } else if (alypay === 0 && hash !== "") {
                // ejecutamos el reporte de pago en la base de datos
                const responseSQL = await sql.run(createWithdrawals, [id_investment, hash, amount, alypay])

                // obtenemos el porcentaje de ganancia
                const { percentage } = responseSQL[0][0]

                // envio de correo
                sendEmailWithdrawals(email, name, amount, currency, hash, percentage)
            }
        }

        res.send({ response: "success" })

    } catch (error) {
        /**Error information */
        WriteError(`report-payments.js - ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

module.exports = router