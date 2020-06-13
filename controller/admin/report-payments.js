const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const moment = require("moment")
const WriteError = require('../../logs/write')

// Emails APIS and from email
const sendEmail = require("../../config/sendEmail")
const { EMAILS } = require("../../config/constant")
const { getHTML } = require("../../config/html")

// Sql transaction
const query = require("../../config/query")
const { getAllPayments, createWithdrawals } = require("../queries")

const sendEmailWithdrawals = async (email = "", name = "", amount = 0, currency = "BTC", hash = "", percentage = 0) => {
    const html = await getHTML("payment.html", { name, amount: amount.toString(), currency, hash, percentage })

    const config = {
        to: email,
        from: EMAILS.MANAGEMENT,
        subject: `Informe de pago - ${moment().format('"DD-MM-YYYY"')}`,
        html
    }

    await sendEmail(config)
}

router.get('/', (_, res) => res.status(500))

router.post('/', [check('id_currency', 'Currency ID is required').isInt()], async (req, res) => {
    const errors = validationResult(req)

    try {
        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id_currency } = req.body

        query(getAllPayments, [id_currency], (response) => res.status(200).send(response[0]))
            .catch(reason => {
                throw reason
            })

    } catch (error) {
        /**Error information */
        WriteError(`report-payments.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }

})

router.post("/apply", [check("data", "data report is required").isArray().exists()], async (req, res) => {
    const errors = validationResult(req)

    try {
        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { data, id_currency } = req.body

        const currency = id_currency === 1 ? "BTC" : "ETH"

        for (let i = 0; i < data.length; i++) {
            /**
             * item object:
             * * id_investment: `INT`
             * * amount: `FLOAT`
             * * name: `STRING`
             * * email: `STRING`
             * * hash: `STRING`
             */
            const { id_investment, hash, amount, name, email } = data[i]

            if (hash !== "" && id_investment !== undefined) {
                await query.withPromises(createWithdrawals, [id_investment, hash, amount])
                    .then(async (response) => {
                        const { percentage } = response[0][0]

                        sendEmailWithdrawals(email, name, amount, currency, hash, percentage)
                    })
                    .catch((reason) => {
                        throw reason.toString()
                    })
            }
        }

        res.send({ response: "success" })

    } catch (error) {
        /**Error information */
        WriteError(`report.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

module.exports = router