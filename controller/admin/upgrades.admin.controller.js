const express = require('express')
const router = express.Router()
const log = require('../../logs/write.config')

// Send Email APi
const sendEmail = require("../../configuration/send-email.config")
const { EMAILS } = require("../../configuration/constant.config")

// Middlewares
const { check, validationResult } = require('express-validator')

// Sql transaction
const sql = require("../../configuration/sql.config")
const { getAllUpgrades, getUpgradeDetails, declineUpgrade, acceptUpgrade } = require("../../configuration/queries.sql")

/**
 * Funcion que ejecuta el envio de correo para notificar
 * al inversor 
 * */
const senMailAccept = async (data = {}, hash = "") => {
    const typeCoin = data.id_currency === 1 ? "BTC" : "ETH"

    // Verificamos si enviamos un email a su sponsor
    if (data.sponsor_email) {
        const config = {
            to: data.sponsor_email,
            from: EMAILS.DASHBOARD,
            subject: `Comision por Upgrade`,
            html: `
            <div
                style="background: #161616; padding: 25px; color: #ffffff; font-size: 1.2em; font-family: Arial, Helvetica, sans-serif; text-align: center; height: 100%;">
                <a href="https://www.speedtradings.com/">
                    <img width="512" height="256"
                        src="https://lh3.googleusercontent.com/XtcodcoWRFK2wQXbDEv6q6RJ26lHZHuSBEn3yBkpzh2dmuWZc546Mm128xdoTjtFIEWUVFp2DjFSB4Bfz44wSfD17QqpogYvq8UBRHtLWb9DZuD9qziilG_J8pEOwigJKfM85zLmWZKR825axHJuR49JD_Q499xq7bgc_2-UjiQI97OdFh-pGgN8jbhmepRHhUmazh_WC3BuZBcw70VSpJGDOBd8Qbqtl0jyDWcT-yUTl3chpl45DmHEwhB0F3updv61LRm96Vz9GRD1EM3ftmzKbAET_M3SON_5QNinYlMH20oqJsmvQ-wBlXiLoDssrlKu-QgvfVaYdQD4l4_9pnqOUzqeRzpIwEMbPMq21MS96ySQVottkdT2aV5ViqOXKvCGhgi0rcBMgEhdhOO7N7X467ohDH26hLgL7gv9XV-VhClkv4X5zn1ykbda2Mpx7ZrwG3LroS3Qxb1xt7J3YyS5uA_7VXoUIlmRW1tijC-itvyVyS5BK4skiazCJIedvWbEFEes1IoGw3BW0YHv6LjC-peUV7CiB2Fib4b79qwxrIdGYOv4UN9dHYHCV4QHaEFe4wb8NMRpTrbO8Et-5vn7mxL2aQn7IziZr-3hra2E5CboMxYrYhMTiXAnEmMTFr3Q4G3ywafX96q4qBIQlF8PHhs6cDciS4NHMKu1CMqOX9c3n66WlLapannN0j02aYF-NA=w1600-h828-ft" />
                </a>
    
                <br />
    
                <h1>Estimado/a ${data.sponsor_name}</h1>
    
                <p>
                    Le informamos que hemos acreditado a su wallet el 5% de <b>(${data.amount_requested * 0.05} ${typeCoin})</b> por comision <b>UPGRADE</b>.
                </p>
    
                <p>
                    <b>HASH:</b> ${hash}
                </p>
    
                <div
                    style="padding: 25px; background-color: rgba(0, 0, 0, 0.2); margin-top: 10px; border-radius: 10px; font-size: 18px; color: #9ed3da;">
                    <p style="text-transform: uppercase;">
                        <b>Referido:</b> ${data.name} - <b>Monto de UPGRADE:</b> ${data.amount_requested} ${typeCoin}
                    </p>
                </div>
    
                <br />
    
                <b style="color: #ffcb08; font-size: 14px;">Saludos, Equipo AlySystem..</b>
            </div>
            `,
        }

        await sendEmail(config).catch(err => new Error(err))
    }

    const config = {
        to: data.email,
        from: EMAILS.DASHBOARD,
        subject: `Upgrade - ${typeCoin}`,
        html: `    
        <div
            style="background: #161616; padding: 25px; color: #ffffff; font-size: 1.2em; font-family: Arial, Helvetica, sans-serif; text-align: center; height: 100%;">
            <a href="https://www.speedtradings.com/">
                <img width="512" height="256"
                    src="https://lh3.googleusercontent.com/XtcodcoWRFK2wQXbDEv6q6RJ26lHZHuSBEn3yBkpzh2dmuWZc546Mm128xdoTjtFIEWUVFp2DjFSB4Bfz44wSfD17QqpogYvq8UBRHtLWb9DZuD9qziilG_J8pEOwigJKfM85zLmWZKR825axHJuR49JD_Q499xq7bgc_2-UjiQI97OdFh-pGgN8jbhmepRHhUmazh_WC3BuZBcw70VSpJGDOBd8Qbqtl0jyDWcT-yUTl3chpl45DmHEwhB0F3updv61LRm96Vz9GRD1EM3ftmzKbAET_M3SON_5QNinYlMH20oqJsmvQ-wBlXiLoDssrlKu-QgvfVaYdQD4l4_9pnqOUzqeRzpIwEMbPMq21MS96ySQVottkdT2aV5ViqOXKvCGhgi0rcBMgEhdhOO7N7X467ohDH26hLgL7gv9XV-VhClkv4X5zn1ykbda2Mpx7ZrwG3LroS3Qxb1xt7J3YyS5uA_7VXoUIlmRW1tijC-itvyVyS5BK4skiazCJIedvWbEFEes1IoGw3BW0YHv6LjC-peUV7CiB2Fib4b79qwxrIdGYOv4UN9dHYHCV4QHaEFe4wb8NMRpTrbO8Et-5vn7mxL2aQn7IziZr-3hra2E5CboMxYrYhMTiXAnEmMTFr3Q4G3ywafX96q4qBIQlF8PHhs6cDciS4NHMKu1CMqOX9c3n66WlLapannN0j02aYF-NA=w1600-h828-ft" />
            </a>

            <br />

            <h1>Estimado/a ${data.name}</h1>            

            <div
                style="padding: 25px; background-color: rgba(0, 0, 0, 0.2); margin-top: 10px; border-radius: 10px; font-size: 18px; color: #9ed3da;">
                <p>
                    Le informamos que hemos recibido tu solicitud de UPGRADE (<b>${data.amount_requested} ${typeCoin}</b>)
                </p>
            </div>

            <br />

            <b style="color: #ffcb08; font-size: 14px;">Saludos, Equipo AlySystem..</b>
        </div>
    `
    }

    await sendEmail(config).catch(err => new Error(err))
}

/**
 * Controlador que enlista todas los solicitudes de upgrades
 */
router.get('/', async (_, res) => {
    try {
        const response = await sql.run(getAllUpgrades)

        res.status(200).send(response[0])
    } catch (error) {
        /**Error information */
        log(`request.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**
 * Controlador que retorna el detalle de un upgrade
 */
router.post('/id', [check('id', 'ID is not valid').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { id } = req.body

        const response = await sql.run(getUpgradeDetails, [id])

        res.status(200).send(response[0][0])

    } catch (error) {
        /**Error information */
        log(`request.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**Controlador que rechaza una solicitud de upgrade */
router.delete('/decline', [check('id', 'ID is not valid').isInt()], async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                message: errors.array()[0].msg
            })
        }

        const { id } = req.body

        await sql.run(declineUpgrade, [id])

        res.status(200).send({ response: 'success' })

    } catch (error) {
        /**Error information */
        log(`request.js - catch execute sql | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

/**Controlador que acepta una solicitud de upgrade */
router.post('/accept', [check('data', 'data is not valid').exists()], async (req, res) => {
    try {
        const errors = validationResult(req)

        // verificamos si hay algun error
        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // obtenemos el parametro 
        const { data } = req.body

        // ejecutamos la consulta
        await sql.run(acceptUpgrade, [data.id])

        res.send({ response: "success" })

    } catch (message) {
        /**Error information */
        log(`upgrades.admin.controller.js - accept upgrade | ${message.toString()}`)

        res.send({ error: true, message })
    }
})

module.exports = router