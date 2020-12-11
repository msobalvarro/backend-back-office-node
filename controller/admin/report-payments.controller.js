const express = require('express')
const router = express.Router()

// import middleware
const { check, validationResult } = require('express-validator')

// import constants and functions
const moment = require("moment")
const log = require('../../logs/write.config')
const _ = require("lodash")
const { ALYHTTP, NOW, EMAILS, AuthorizationAdmin, breakTime, socketAdmin, eventSocketNames } = require("../../configuration/constant.config")

// Emails APIS and from email
const sendEmail = require("../../configuration/send-email.config")
const { getHTML } = require("../../configuration/html.config")

// import redux configuration
const store = require("../../configuration/store/index.store")
const { reportPayment } = require("../../configuration/store/actions.json")

// Sql transaction
const sql = require("../../configuration/sql.config")
const { getAllPayments, createWithdrawals, loginAdmin } = require("../../configuration/queries.sql")

const sendEmailWithdrawals = async (email = "", name = "", amount = 0, currency = "BTC", hash = "", percentage = 0) => {
    const html = await getHTML("payment.html", {
        name,
        amount: amount.toString(),
        currency,
        hash,
        percentage
    })

    const config = {
        to: email,
        from: EMAILS.MANAGEMENT,
        subject: `Informe de pago - ${moment(NOW()).format('"DD-MM-YYYY"')}`,
        html
    }

    await sendEmail(config)
}

router.get("/credit-alypay", async (req, res) => {
    try {
        // console.time("petition")

        const { data } = await ALYHTTP.get("/wallet")

        const object = {
            btc: data.find(e => e.symbol === "BTC").amount,
            eth: data.find(e => e.symbol === "ETH").amount,
        }

        res.send(object)
    } catch (error) {

    }
})

/**
 * Controlado que retorna la informacion de pago diario del trading
 */
router.get('/:id_currency', async (req, res) => {
    try {
        const { id_currency } = req.params

        if (!id_currency) {
            throw String("Error en procesar la moneda")
        }

        // creamos el arreglo que retornaremos
        const data = []

        // ejecutamos la consulta para obtener el reporte de pago
        const dataSQL = await sql.run(getAllPayments, [parseInt(id_currency)])

        // mapeamos los elementos para calcular la comisison
        for (let i = 0; i < dataSQL[0].length; i++) {
            const elementSQL = dataSQL[0][i]

            const dataObject = {
                ...elementSQL,

                // calculamos al comision
                // si es alypay la comision es CERO (0), 
                // de lo contrario el monto a depositar será el monto menos el 2%
                comission: (elementSQL.alypay === 1) ? null : _.floor(elementSQL.amount - (elementSQL.amount * 0.02), 8)
            }

            // lo agregamos a array de los datos a enviar
            data.push(dataObject)
        }

        res.send(data)

    } catch (message) {
        log(`report-payments.controller.js | Error al generar reporte | ${message.toString()}`)

        res.send({ error: true, message })
    }

})

const checkParamsApplyReport = [
    check("data", "Los datos del reporte son requeridos").isArray().exists(),
    check("id_currency", "El id de la moneda no es correcto").isInt().exists(),
    check("password", "Password is required").isString().exists()
]

/**
 * Controlador que ejeucta el reporte de pago del trading diario
 */
router.post("/apply", checkParamsApplyReport, async (req, res) => {
    try {
        const errors = validationResult(req)

        // verificamos si no hay error en los parametros
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Obtenemos los parametros recibidos por el back office
        const { data, id_currency, password } = req.body

        const { user } = req

        // autenticamos al admin
        await AuthorizationAdmin(password)

        // verificamos el simbolo de la moneda
        const currency = id_currency === 1 ? "BTC" : "ETH"

        // obtenemos los estados de redux
        const { updates } = store.getState()

        // verificamos si ya han hecho trading
        if (updates.PAYMENT[currency].date !== null) {
            // VERIFICAMOS SI HAN HECHO TRADING el dia de hoy
            if (moment().isSame(updates.PAYMENT[currency].date, "d")) {
                throw String(`Pago [${currency}] | Aplicado por ${updates.PAYMENT[currency].author}`)
            }
        }

        // Ejecutamos la peticion al server de todas mis wallets
        const { data: dataWallet } = await ALYHTTP.get("/wallet")

        // verificamos si hay un error 
        if (dataWallet.error) {
            throw String(dataWallet.message)
        }

        // enviamos el evento que activa la modal
        socketAdmin.emit(eventSocketNames.onTogglePercentage, true)

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
            const { id_investment, hash, amount, name, email, alypay, wallet, paymented } = data[i]

            // verificamos si el formato de parameetro alypay es correcto 
            if (alypay !== 0 && alypay !== 1) {
                throw String(`Formato de paramtro AlyPay no es correcto ${alypay} `)
            }

            // validamos el id del plan
            if (id_investment === undefined || id_investment === null) {
                throw String(`El proceso de pago se ha detenido porque el de ${name} no se ha encontrado en la base de datos`)
            }

            // verificamos si este plan ya se pago
            if (paymented === false) {

                // verificamos si el pago es atravez de alypay
                // verificamos si no hay hash de transaccion previo
                if (alypay === 1) {
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

                    // ejecutamos el reporte de pago en la base de datos
                    const responseSQL = await sql.run(createWithdrawals, [id_investment, dataTransaction.hash, amount, alypay])

                    // obtenemos el porcentaje de ganancia
                    const { percentage } = responseSQL[0][0]

                    // veriricamos si ya esta pagado
                    if(percentage === null) {
                        throw String(`Pago repetido: ${name}`)
                    }
                    
                    // break de medio segundo
                    await breakTime(500)

                    // envio de correo
                    await sendEmailWithdrawals(email, name, amount, currency, dataTransaction.hash, percentage).catch(e => console.log(`Error al enviar correo: ${e.toString()}`))

                } else if (hash !== null) {
                    const paramsSQL = [id_investment, hash, amount, alypay]

                    // ejecutamos el reporte de pago en la base de datos
                    const responseSQL = await sql.run(createWithdrawals, paramsSQL)

                    // obtenemos el porcentaje de ganancia
                    const { percentage } = responseSQL[0][0]

                    // veriricamos si ya esta pagado
                    if(percentage !== null) {
                        // break de medio segundo
                        await breakTime(500)

                        // envio de correo
                        await sendEmailWithdrawals(email, name, amount, currency, hash, percentage).catch(e => console.log(`Error al enviar correo: ${e.toString()}`))
                    }
                }
            }

            // enviamos por socket el porcentaje de los pagados
            const currentPercentageValue = (((i + 1) / data.length) * 100).toFixed(2)

            console.log(`${currentPercentageValue}% | Payment applied`)

            // emitimos el porcentaje
            socketAdmin.emit(eventSocketNames.setPercentageCharge, { currentPercentageValue, name, title: "Aplicando Reporte de Pago" })

        }

        // enviamos el evento que desactiva la modal
        socketAdmin.emit(eventSocketNames.onTogglePercentage, false)

        // despachamos al store de redux la ultima trading
        store.dispatch({
            type: reportPayment,
            coin: currency,
            payload: {
                date: NOW(),
                author: user.email
            }
        })

        res.send({ response: "success" })

    } catch (message) {
        /**Error information */
        log(`report-payments.controller.js - ${message.toString()}`)

        res.send({ error: true, message })
    }
})

module.exports = router