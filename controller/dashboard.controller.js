const express = require('express')
const router = express.Router()

// import constants and functions
const _ = require("lodash")
const WriteError = require('../logs/write.config')

// import middlewaees
const { auth } = require('../middleware/auth.middleware')
const { default: validator } = require('validator')

// Mysql
const { run } = require('../configuration/sql.config')
const { getIdInvestment, getShortHistoryTrading, getHistoryTrading } = require('../configuration/queries.sql')

// controlador que retorna todos los datos que la grafica necesita
router.get('/:currency', auth, async (req, res) => {
    // obtenemos el id del usuario de quien hace la peticion
    const { id_user } = req.user

    // obtenemos el id de la moneda btc/eth 
    const { currency } = req.params

    const QUERIES = {
        // Obtiene el monto del plan
        INVESTMENT: `select * from investment where id = ?`,

        // obtiene todo lo pagado hasta el momento
        BALANCE: `SELECT amount, date FROM payments where id_investment = ? order by id desc`,
    }

    try {
        // comprobamos si el parametro de currency es un numero
        if (!validator.isInt(currency)) {
            throw String("El parametro de la moneda no es correcto")
        }

        // constante que obtiene el id del plan solictado
        const dataIDInvestment = await run(getIdInvestment, [id_user, currency])

        // verificamos si el plan existe
        if (dataIDInvestment.length === 0) {
            res.send({})

            return false
        }

        // constante que almacena el id del plan solictado
        const { id } = dataIDInvestment[0]

        // constante que almacena la informacion del plan
        const investmentInfo = await run(QUERIES.INVESTMENT, [id])

        // obetenemos los reportes de pagos
        const allReportsTradingsPayments = await run(QUERIES.BALANCE, [id])

        // obtenemos top reportes de trading
        const responseDashboardRetirement = await run(getShortHistoryTrading, [id])

        // constante que almacenara los pagos de trading
        const sumAmount = []

        // mapeamos el monto para acumularlo en `sumAmount`
        for (let i = 0; i < allReportsTradingsPayments.length; i++) {
            const { amount } = allReportsTradingsPayments[i]

            sumAmount.push(amount)
        }

        // Constante que almacena el monto a ganar del plan
        const amount_to_win = _.floor((investmentInfo[0].amount * 2), 8)

        // Monto pagado hasta el momento
        const total_paid = _.floor(_.sum(sumAmount), 8)

        // informacion del header dashboard
        const information = {
            // id del plan
            id_investment: id,

            // monto del plan
            amount: investmentInfo[0].amount,

            // monto pagado hasta el momento
            total_paid,

            // primer reporte de pago
            start_date: allReportsTradingsPayments[allReportsTradingsPayments.length - 1].date,

            // si el plan esta aprovado 0/1
            approved: investmentInfo[0].approved,

            // ultimo reporte de pago
            last_pay: allReportsTradingsPayments[0].amount,

            // monto a ganar (monto x2)
            amount_to_win,

            // monto restante
            amount_rest: _.floor((amount_to_win - total_paid), 9)
        }

        // ejecutamos el llamado de la api precios de coinmarketcap
        const _prices = await req.uest({ method: "GET", url: "/collection/prices" })

        // sacamos los datos de la respuesta
        const { BTC, ETH } = _prices.body

        const prices = {
            BTC: BTC.quote.USD.price,
            ETH: ETH.quote.USD.price,
        }

        res.send({ info: information, prices, history: responseDashboardRetirement })

    } catch (error) {
        WriteError(`dashboard.controller.js | ${error}`)

        res.send({
            error: true,
            message: error.toString()
        })
    }
})

// controlador para obtener todo el historial de trading
router.get("/all-reports/:currency", auth, async (req, res) => {
    try {
        // get current id from params
        const { id_user } = req.user

        const { currency } = req.params

        // comprobamos si el parametro de currency es un numero
        if (!validator.isInt(currency)) {
            throw String("El parametro de la moneda no es correcto")
        }

        // ejecutamos el llamado de la api precios de coinmarketcap
        const _prices = await req.uest({ method: "GET", url: "/collection/prices" })

        // sacamos los datos de la respuesta
        const { BTC, ETH } = _prices.body

        const price = parseInt(currency) === 1 ? BTC.quote.USD.price : ETH.quote.USD.price

        // constante que obtiene el id del plan solictado
        const dataIDInvestment = await run(getIdInvestment, [id_user, currency])

        // verificamos si el plan existe
        if (dataIDInvestment.length === 0) {
            res.send({ history: [], price })

            return false
        }

        // (3) consulta para extraer datos detalle de retiros/ ganancias totales
        const responseDashboardRetirement = await run(getHistoryTrading, [dataIDInvestment[0].id])

        res.send({ history: responseDashboardRetirement, price })
    } catch (error) {
        WriteError(`dashboard-details.controller.js | ${error}`)

        res.send({ error: true, message: error.toString() })
    }
})

module.exports = router