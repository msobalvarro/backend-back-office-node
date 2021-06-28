const express = require('express')
const router = express.Router()

// import constants and functions
const _ = require("lodash")
const WriteError = require('../logs/write.config')
const moment = require("moment")
const { NOW, maxAmountInMonth } = require("../configuration/constant.config")

// import services
const investmentService = require("../services/investment.service")

// import middlewaees
const { auth } = require('../middleware/auth.middleware')
const { default: validator } = require('validator')

// Mysql
const { run } = require('../configuration/sql.config')
const {
    getIdInvestment,
    getShortHistoryTrading,
    getHistoryTrading,
    getHistoryTradingByDateRanges,
    getTotalAmountUogrades
} = require('../configuration/queries.sql')

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

        const totalAmount = await run(getTotalAmountUogrades, [id])
        
        // aca almacenaremos el monto total de los upgrades del mes
        const totalMonth = _.sumBy(totalAmount, 'monto_usd') || 0

        // constante que almacena la informacion del plan
        const investmentInfo = await run(QUERIES.INVESTMENT, [id])

        // obetenemos los reportes de pagos
        const allReportsTradingsPayments = await run(QUERIES.BALANCE, [id])

        // obtenemos top reportes de trading
        const responseDashboardRetirement = await run(getShortHistoryTrading, [id])

        // constante que almacenara los pagos de trading
        const sumAmount = _.sumBy(allReportsTradingsPayments, 'amount')       

        // Constante que almacena el monto a ganar del plan
        const amount_to_win = _.floor((investmentInfo[0].amount * 2), 8)

        // informacion del header dashboard
        const information = {
            // id del plan
            id_investment: id,

            // monto del plan
            amount: investmentInfo[0].amount,

            // monto pagado hasta el momento
            total_paid: _.floor(sumAmount, 8),

            // primer reporte de pago
            start_date: (allReportsTradingsPayments.length > 0) ? allReportsTradingsPayments[allReportsTradingsPayments.length - 1].date : NOW(),

            // si el plan esta aprovado 0/1
            approved: investmentInfo[0].approved,

            // ultimo reporte de pago
            last_pay: (allReportsTradingsPayments.length > 0) ? allReportsTradingsPayments[0].amount : null,

            // monto a ganar (monto x2)
            amount_to_win,

            // monto restante
            amount_rest: _.floor((amount_to_win - sumAmount), 8),

            // monto restante a upgradear en el mes
            mount_rest_upgrade: (maxAmountInMonth - totalMonth),

            // monto maximo a upgradear por mes
            max_amount_upgrade: maxAmountInMonth
        }

        // ejecutamos el llamado de la api precios de coinmarketcap
        const _prices = await req.uest({ method: "GET", url: "/collection/prices" })

        // sacamos los datos de la respuesta
        const { BTC, ETH } = _prices.body

        const price = parseInt(currency) === 1 ? BTC.quote.USD.price : ETH.quote.USD.price

        // Obtenemos las transaccion de ese plan
        const upgradesAlyPay = await investmentService.getLastTransactions(id)

        // obtenemos las transacciones alypay
        const transactionWithAlyPay = _.find(upgradesAlyPay, p => p.transaction.alypay === true)

        // verificamos que el dia del registro sea un dia como hoy
        // const upgrade = moment(information.start_date).format('DD').toString() === moment().subtract(6, "hours").format('DD').toString()
        // verificamos si el usuario ya ha hechon upgrade con alypay
        const upgrade = transactionWithAlyPay === undefined

        res.send({ price, info: information, history: responseDashboardRetirement, upgrade })
        // res.send({ sucess: true, totalMonth })

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

        // fecha de inicio / fin del historial de pagos de trading
        const { date_from = null, date_to = null } = req.query

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

        // Se extrae el id del plan de inversión
        const { id: id_investment } = dataIDInvestment[0]
        // Parámetros para el histirial con rangos de fechas
        const dateRangesParams = [
            id_investment,
            `${date_from} 00:00:00`,
            `${date_to} 23:59:59`
        ]

        // (3) consulta para extraer datos detalle de retiros/ ganancias totales
        // Sí se indican los rangos de fechas, se limita el historial a esos rangos
        const responseDashboardRetirement = (date_from && date_to)
            ? await run(getHistoryTradingByDateRanges, dateRangesParams)
            : await run(getHistoryTrading, [id_investment])

        res.send({ history: responseDashboardRetirement, price })
    } catch (error) {
        WriteError(`dashboard-details.controller.js | ${error}`)

        res.send({ error: true, message: error.toString() })
    }
})

module.exports = router