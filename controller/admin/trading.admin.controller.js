const express = require('express')
const router = express.Router()
const moment = require("moment")
const _ = require("lodash")

// Import HTML Template Function
const { getHTML } = require("../../configuration/html.config")

// Email send api
const sendEmail = require("../../configuration/send-email.config")
const { EMAILS, NOW } = require("../../configuration/constant.config")

// Write logs
const log = require('../../logs/write.config')

// import middlewares
const { check, validationResult } = require('express-validator')

// Sql transaction
const sql = require("../../configuration/sql.config")
const { getDataTrading, createPayment, getUpgradeAmount } = require("../../configuration/queries.sql")

const checkParamsRequest = [
    check('id_currency', 'ID currency is required').isInt(),
    check('percentage', 'Percentaje is requerid').isFloat()
]

router.post('/', checkParamsRequest, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Get params from petition
        const { percentage, id_currency } = req.body

        // Select symboil coin
        const coinType = id_currency === 1 ? "BTC" : "ETH"

        const response = await sql.run(getDataTrading, [id_currency])

        for (let index = 0; index < response[0].length; index++) {
            // Get data map item
            const { amount, email, name, id } = response[0][index]

            console.log(`Aplicando Trading a ${name}`)
            console.time("trading")

            // obtenemos el monto de los upgrades del dia de hoy
            const dataSQLUpgrades = await sql.run(getUpgradeAmount, [NOW(), id])

            // creamos una constante que restara el monto de upgrades acumulados en el dia
            const amountSubstract = dataSQLUpgrades[0].amount !== null ? _.subtract(amount, dataSQLUpgrades[0].amount) : amount

            // Creamos el nuevo monto a depositar
            // `percentage (0.5 - 1)%`
            const newAmount = _.floor((percentage * amountSubstract) / 100, 8)
            // const newAmount = _.floor((percentage * amount) / 100, 8)

            // Get HTML template with parans
            const html = await getHTML("trading.html", { name, percentage, newAmount, typeCoin: coinType })

            // Config send email
            const config = {
                to: email,
                from: EMAILS.DASHBOARD,
                subject: `Informe de ganancias ${moment(NOW()).format('"DD-MM-YYYY"')}`,
                html,
            }

            // Send Email api
            await sendEmail(config)

            // Execute sql of payments register
            await sql.run(createPayment, [id, percentage, newAmount])

            console.timeEnd("trading")
        }

        // Send Success
        res.status(200).send({ response: 'success' })
    } catch (error) {
        log(`trading.admin.js - catch execute sql | ${error}`)
        
        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router