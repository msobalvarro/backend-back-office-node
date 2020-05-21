const express = require('express')
const router = express.Router()
const moment = require("moment")
const { check, validationResult } = require('express-validator')
const sgMail = require('@sendgrid/mail')
const WriteError = require('../../logs/write')


if (process.env.NODE_ENV !== 'production') require('dotenv').config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// Sql transaction
const query = require("../../config/query")
const { getDataTrading } = require("../queries")

router.post('/', [
    check('id_currency', 'ID currency is required').isInt(),
    check('percentage', 'Percentaje is requerid').isFloat()
], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.json({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { percentage, id_currency } = req.body

        const typeCoin = id_currency === 1 ? "BTC" : "ETH"

        const queryScript = (_id = 0, _percentage = 0, _amount = 0) => `call createPayment(${_id}, ${_percentage}, ${_amount});`

        query(getDataTrading, [id_currency], async (response) => {
            for (let index = 0; index < response[0].length; index++) {

                const { amount, email, name, id } = response[0][index]

                // Creamos el nuevo monto a depositar
                // `percentage (0.5 - 1)%`
                const newAmount = (percentage * amount) / 100

                const msg = {
                    to: email,
                    from: 'dashboard@speedtradings.com',
                    subject: `Informe de ganancias ${moment().format('"DD-MM-YYYY"')}`,
                    html: `
                    <div
                        style="background: #FFF; padding: 25px; color: #000; font-size: 1.2em; font-family: Arial, Helvetica, sans-serif; text-align: center; height: 100%;">
                        <a href="https://www.speedtradings.com/">
                            <img width="512" height="256"
                                src="https://lh3.googleusercontent.com/XtcodcoWRFK2wQXbDEv6q6RJ26lHZHuSBEn3yBkpzh2dmuWZc546Mm128xdoTjtFIEWUVFp2DjFSB4Bfz44wSfD17QqpogYvq8UBRHtLWb9DZuD9qziilG_J8pEOwigJKfM85zLmWZKR825axHJuR49JD_Q499xq7bgc_2-UjiQI97OdFh-pGgN8jbhmepRHhUmazh_WC3BuZBcw70VSpJGDOBd8Qbqtl0jyDWcT-yUTl3chpl45DmHEwhB0F3updv61LRm96Vz9GRD1EM3ftmzKbAET_M3SON_5QNinYlMH20oqJsmvQ-wBlXiLoDssrlKu-QgvfVaYdQD4l4_9pnqOUzqeRzpIwEMbPMq21MS96ySQVottkdT2aV5ViqOXKvCGhgi0rcBMgEhdhOO7N7X467ohDH26hLgL7gv9XV-VhClkv4X5zn1ykbda2Mpx7ZrwG3LroS3Qxb1xt7J3YyS5uA_7VXoUIlmRW1tijC-itvyVyS5BK4skiazCJIedvWbEFEes1IoGw3BW0YHv6LjC-peUV7CiB2Fib4b79qwxrIdGYOv4UN9dHYHCV4QHaEFe4wb8NMRpTrbO8Et-5vn7mxL2aQn7IziZr-3hra2E5CboMxYrYhMTiXAnEmMTFr3Q4G3ywafX96q4qBIQlF8PHhs6cDciS4NHMKu1CMqOX9c3n66WlLapannN0j02aYF-NA=w1600-h828-ft" />
                        </a>

                        <br />

                        <h1>Estimado/a ${name}</h1>

                        <p>
                            Le informamos que las ganancias generadas por el trading del día de hoy ya fueron aplicadas.
                        </p>

                        <div
                            style="padding: 25px; background-color: rgba(0, 0, 0, 0.2); margin-top: 10px; border-radius: 10px; text-transform: uppercase;">
                            <p>
                                Corresponde al <b>${percentage}%</b> que equivale a <b>${newAmount} ${typeCoin}</b>
                            </p>
                        </div>

                        <p>
                            Puede confirmarlo en su Dashboard. Gracias por confiar en nosotros.
                        </p>

                        <br />

                        <b style="color: #20a5c2; font-size: 14px;">Saludos, Equipo de Speed Tradings Bank.</b>
                    </div>
                    `,
                }

                await sgMail.send(msg)

                await query(queryScript(id, percentage, newAmount), [], (response) => { }).catch(reason => { throw reason })
            }

            res.status(200).send({ response: 'success' })

        }).catch(reason => { throw reason })
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