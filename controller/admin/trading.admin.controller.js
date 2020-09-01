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
const WriteError = require('../../logs/write.config')

// import middlewares
const { check, validationResult } = require('express-validator')

// Sql transaction
const query = require("../../configuration/query.sql")
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

        const response = await query.withPromises(getDataTrading, [id_currency])

        for (let index = 0; index < response[0].length; index++) {


            // Get data map item
            const { amount, email, name, id } = response[0][index]

            // const dataSQLUpgrades = await query.withPromises(getUpgradeAmount, [moment().add(new Date().getTimezoneOffset(), "minutes").toDate(), id])

            // // creamos una constante que restara el monto de upgrades acumulados en el dia
            // const amountSubstract = dataSQLUpgrades[0].amount !== null ? _.subtract(amount, dataSQLUpgrades[0].amount) : amount


            // Creamos el nuevo monto a depositar
            // `percentage (0.5 - 1)%`
            const newAmount = _.floor((percentage * amount) / 100, 8)

            // Get HTML template with parans
            const html = await getHTML("trading.html", { name, percentage, newAmount, typeCoin: coinType })

            // Config send email
            const config = {
                to: email,
                from: EMAILS.DASHBOARD,
                subject: `Informe de ganancias ${moment(NOW()).format('"DD-MM-YYYY"')}`,
                html,
            }

            // // Send Email api
            await sendEmail(config)


            // Execute query of payments register
            await query.withPromises(createPayment, [id, percentage, newAmount])
        }

        // Send Success
        res.status(200).send({ response: 'success' })
    } catch (error) {
        WriteError(`trading.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router