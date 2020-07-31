const express = require('express')
const router = express.Router()
const moment = require("moment")

// Import HTML Template Function
const { getHTML } = require("../../configuration/html.config")

// Email send api
const sendEmail = require("../../configuration/send-email.config")
const { EMAILS } = require("../../configuration/constant.config")

// Write logs
const WriteError = require('../../logs/write.config')

// import middlewares
const { check, validationResult } = require('express-validator')

// Sql transaction
const query = require("../../configuration/query.sql")
const { getDataTrading, createPayment } = require("../../configuration/queries.sql")

const checkParamsRequest = [
    check('id_currency', 'ID currency is required').isInt(),
    check('percentage', 'Percentaje is requerid').isFloat()
]

router.post('/', checkParamsRequest, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }


        // Get params from petition
        const { percentage, id_currency } = req.body

        // Select symboil coin
        const typeCoin = id_currency === 1 ? "BTC" : "ETH"

        query.withPromises(getDataTrading, [id_currency])
            .then(async (response) => {
                for (let index = 0; index < response[0].length; index++) {

                    // Get data map item
                    const { amount, email, name, id } = response[0][index]

                    // Creamos el nuevo monto a depositar
                    // `percentage (0.5 - 1)%`
                    const newAmount = (percentage * amount) / 100

                    // Get HTML template with parans
                    const html = await getHTML("trading.html", { name, percentage, newAmount, typeCoin })

                    // Config send email
                    const config = {
                        to: email,
                        from: EMAILS.DASHBOARD,
                        subject: `Informe de ganancias ${moment().format('"DD-MM-YYYY"')}`,
                        html,
                    }

                    // Send Email api
                    await sendEmail(config)
                        .catch(reason => {
                            throw reason
                        })


                    // Execute query of payments register
                    await query.withPromises(createPayment, [id, percentage, newAmount])
                        .catch(reason => {
                            throw reason
                        })

                    console.log(`Se ha pagado a ${name}`)
                }

                // Send Success
                res.status(200).send({ response: 'success' })
            })
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