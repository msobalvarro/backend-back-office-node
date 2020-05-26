const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const sgMail = require('@sendgrid/mail')
const moment = require("moment")
const WriteError = require('../../logs/write')

if (process.env.NODE_ENV !== 'production') require('dotenv').config()

// Sql transaction
const query = require("../../config/query")
const { getAllPayments, createWithdrawals } = require("../queries")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendEmailWithdrawals = async (email = "", name = "", amount = 0, currency = "BTC") => {
    const msg = {
        to: email,
        from: 'gerencia@speedtradings.com',
        subject: `Informe de pago - ${moment().format('"DD-MM-YYYY"')}`,
        html: `
        <div
            style="background: #161616; padding: 25px; color: #ffffff; font-size: 1.2em; font-family: Arial, Helvetica, sans-serif; text-align: center; height: 100%;">
            <a href="https://www.speedtradings.com/">
                <img width="512" height="256"
                    src="https://lh3.googleusercontent.com/XtcodcoWRFK2wQXbDEv6q6RJ26lHZHuSBEn3yBkpzh2dmuWZc546Mm128xdoTjtFIEWUVFp2DjFSB4Bfz44wSfD17QqpogYvq8UBRHtLWb9DZuD9qziilG_J8pEOwigJKfM85zLmWZKR825axHJuR49JD_Q499xq7bgc_2-UjiQI97OdFh-pGgN8jbhmepRHhUmazh_WC3BuZBcw70VSpJGDOBd8Qbqtl0jyDWcT-yUTl3chpl45DmHEwhB0F3updv61LRm96Vz9GRD1EM3ftmzKbAET_M3SON_5QNinYlMH20oqJsmvQ-wBlXiLoDssrlKu-QgvfVaYdQD4l4_9pnqOUzqeRzpIwEMbPMq21MS96ySQVottkdT2aV5ViqOXKvCGhgi0rcBMgEhdhOO7N7X467ohDH26hLgL7gv9XV-VhClkv4X5zn1ykbda2Mpx7ZrwG3LroS3Qxb1xt7J3YyS5uA_7VXoUIlmRW1tijC-itvyVyS5BK4skiazCJIedvWbEFEes1IoGw3BW0YHv6LjC-peUV7CiB2Fib4b79qwxrIdGYOv4UN9dHYHCV4QHaEFe4wb8NMRpTrbO8Et-5vn7mxL2aQn7IziZr-3hra2E5CboMxYrYhMTiXAnEmMTFr3Q4G3ywafX96q4qBIQlF8PHhs6cDciS4NHMKu1CMqOX9c3n66WlLapannN0j02aYF-NA=w1600-h828-ft" />
            </a>

            <br />

            <h1>Estimado/a ${name}</h1>

            <p>
                Le informamos que su pago de <b>${amount.toString()} ${currency}</b> se ha depositado.
            </p>

            <div
                style="padding: 25px; background-color: rgba(0, 0, 0, 0.2); margin-top: 10px; border-radius: 10px; font-size: 18px; color: #000;">
                <p style="text-transform: uppercase;">
                    Puede verificarlo en wallet, gracias por confiar en nosotros.
                </p>
            </div>

            <br />

            <b style="color: #20a5c2; font-size: 14px;">Saludos, Equipo de Speed Tradings Bank.</b>
        </div>
        `,
    }

    await sgMail.send(msg)
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

            if (hash !== "") {
                await query(
                    createWithdrawals,
                    [id_investment, hash, amount],
                    () => sendEmailWithdrawals(email, name, amount, currency)
                )
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