const express = require('express')
const router = express.Router()

// import mysql configuration
const sql = require("../../configuration/sql.config")
const { getActiveCommissions, getCommissionById, createResponsePayComission } = require("../../configuration/queries.sql")

// import constants and functions
const _ = require("lodash")
const moment = require("moment")
const log = require("../../logs/write.config")
const email = require("../../configuration/send-email.config")
const { getHTML } = require("../../configuration/html.config")
const { NOW, ALYHTTP, EMAILS } = require("../../configuration/constant.config")

/** Constante que refleja cuando estara una comsion pendiente en horas (48 despues) */
const STATE_HOURS_PENDING = 48

/**Controlador que enlista todos los sponsors */
router.get("/", async (_req, res) => {
    try {
        // Ejeuctamos la consulta
        const dataQuery = await sql.run(getActiveCommissions)

        // Creamos el arreglo vacio para mandarlo al cliente
        const data = []

        for (let i = 0; i < dataQuery.length; i++) {
            const element = dataQuery[i]

            // construimos el elemento con los datos
            const object = {
                id: element.id,
                sponsor: element.sponsor,
                coin: element.coin,
                amount: _.floor((element.amount * element.percentage), 8),
                symbol: element.coin === "Bitcoin" ? "BTC" : "ETH",

                // con la propiedad active 
                active: moment(element.date).diff(NOW(), "hours") >= STATE_HOURS_PENDING
            }

            data.push(object)
        }

        res.send(data)
    } catch (message) {
        log(`comission.admin.controller.js | error al obtener la lista | ${message.toString()}`)

        res.send({ error: true, message })
    }
})

/**Controlador que retorna informacion mas detallada de un sponsor */
router.get("/:id", async (req, res) => {
    try {
        const { id: dataID } = req.params

        // convertimos el id de `string` a `int`
        const id = parseInt(dataID)

        // verificamos si el id 
        if (isNaN(id)) {
            throw String("El id no es correcto")
        }

        // ejecutamos la consulta para obtener los datos del sponsor
        const dataSQL = await sql.run(getCommissionById, [id])

        // verificamos si el id existe
        if (dataSQL.length === 0) {
            throw String("No se encontro registros")
        }

        // construimos el objeto que enviaremos de respuesta
        const dataObject = {
            client: dataSQL[0].name_action,
            name: dataSQL[0].name_sponsor,
            email: dataSQL[0].email_sponsor,
            coin: dataSQL[0].name_coin,
            symbol: dataSQL[0].name_coin === "Bitcoin" ? "BTC" : "ETH",
            date: dataSQL[0].date_payment,
            amount: dataSQL[0].amount,
            comission_amount: _.floor((dataSQL[0].amount * dataSQL[0].percentage_fees), 8),
            percertage: (dataSQL[0].percentage_fees * 100),
            active: moment(dataSQL[0].date_payment).diff(NOW(), "hours") >= STATE_HOURS_PENDING,
            wallet: dataSQL[0].wallet,
            alypay: dataSQL[0].alypay === 1,
        }

        res.send(dataObject)

    } catch (message) {
        log(`comission.admin.controller.js | error al obtener detalle de la comission | ${message.toString()}`)

        res.send({ error: true, message })
    }
})

/**Controlador que acepta la comsion del sponsor */
router.post("/accept", async (req, res) => {
    try {
        console.log(req.user)

        // obtenemos los parametros de la paticion post
        const { id: dataID, hash: hashReceived } = req.body

        // convertimos el id de `string` a `int`
        const id = parseInt(dataID)

        // verificamos si el id 
        if (isNaN(id)) {
            throw String("El id no es correcto")
        }

        // ejecutamos la consulta para obtener los datos del sponsor
        const dataSQL = await sql.run(getCommissionById, [id])

        // verificamos si el id existe
        if (dataSQL.length === 0) {
            throw String("No se encontro registros")
        }


        // Variable que contendra el hash de transaccion depositp/alypat
        let hashTransaction = ""

        // constante que almacena el monto a pagar el sponsor
        const amount = _.floor((dataSQL[0].amount * dataSQL[0].percentage_fees), 8)

        // Validamos el simbolo de la moneda en la comision
        const currency = dataSQL[0].name_coin === "Bitcoin" ? "BTC" : "ETH"


        // verificamos si la comision va para AlyPay
        if (dataSQL[0].alypay === 1) {
            // Ejecutamos la peticion al server de todas mis wallets
            const { data: dataWallet } = await ALYHTTP.get("/wallet")

            /// verificamos si hay un error al obtener las carteras de SpeedTradings
            if (dataWallet.error) {
                throw String(dataWallet.message)
            }

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
                wallet: dataSQL[0].wallet.trim(),
                symbol: dataWalletClient[0].symbol,
            }

            // ejecutamos el api para la transaccion
            // const { data: dataTransaction } = await ALYHTTP.post("/wallet/transaction", vars)

            // verificamos si hay error en la transaccion alypay
            // if (dataTransaction.error) {
            //     throw String(dataTransaction.message, name)
            // }

            // asignamos el hash de alyPay
            // hashTransaction = dataTransaction.hash

            console.log(vars)
        } else {
            // verificamos si el hash de transaccion manual tiene formato
            if (!hashReceived || typeof hashReceived !== "string") {
                throw String("Ingrese un hash de transaccion")
            } else {
                // si es correcto se lo asignamos a la variable que contendrá el hash final
                hashTransaction = hashReceived
            }
        }

        // ejecutamos la consulta de la respuesta en base de datos
        await sql.run(createResponsePayComission, [id, hashTransaction])

        // Preparamos las configuracions de la plantillas
        const html = await getHTML("sponsor.html", {
            name: dataSQL[0].name_sponsor,
            comission_amount: amount,
            symbol: currency,
            percertage: dataSQL[0].percentage_fees,
            hash: hashTransaction,
            nameRefer: dataSQL[0].name_action,
            amount: dataSQL[0].amount,
            symbolRefered: currency,
        })

        console.log({ from: EMAILS.DASHBOARD, to: dataSQL[0].email_sponsor, subject: "Comisión por referido" })

        // enviamos el correo
        await email({ from: EMAILS.DASHBOARD, to: dataSQL[0].email_sponsor, subject: "Comisión por referido", html })

        res.send({ response: "success" })

    } catch (message) {
        log(`comission.admin.controller.js | error al aceptar | ${message.toString()}`)

        res.send({ error: true, message })
    }
})

/** Controlador que rechaza el pago de un sponosr */
router.post("/decline", async (req, res) => {
    try {
        // obtenemos los parametros de la paticion post
        const { id: dataID } = req.body

        // convertimos el id de `string` a `int`
        const id = parseInt(dataID)

        // verificamos si el id 
        if (isNaN(id)) {
            throw String("El id no es correcto")
        }

        // ejecutamos la consulta para obtener los datos del sponsor
        const dataSQL = await sql.run(getCommissionById, [id])

        // verificamos si el id existe
        if (dataSQL.length === 0) {
            throw String("No se encontro registros")
        }

        await sql.run(createResponsePayComission, [id, null])

        res.send({ response: "success" })
    } catch (error) {

    }
})

module.exports = router