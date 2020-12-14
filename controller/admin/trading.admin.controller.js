const express = require('express')
const router = express.Router()
const moment = require("moment")
const _ = require("lodash")

// Import HTML Template Function
const { getHTML } = require("../../configuration/html.config")

// Email send api
const sendEmail = require("../../configuration/send-email.config")
const { EMAILS, NOW, AuthorizationAdmin, breakTime, socketAdmin, eventSocketNames } = require("../../configuration/constant.config")

// Write logs
const log = require('../../logs/write.config')

// import middlewares
const { check, validationResult } = require('express-validator')

// import redux configuration
const store = require("../../configuration/store/index.store")
const { reportTrading } = require("../../configuration/store/actions.json")

// Sql transaction
const sql = require("../../configuration/sql.config")
const { getDataTrading, createPayment, getUpgradeAmount, loginAdmin } = require("../../configuration/queries.sql")

const checkParamsRequest = [
    check('id_currency', 'ID currency is required').isInt(),
    check('percentage', 'Percentaje is requerid').isFloat(),
    check('password', 'Password is require').isString().exists(),
]

router.post('/', checkParamsRequest, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Get params from petition
        const { percentage, id_currency, password } = req.body
        const { user } = req

        // autenticamos al admin
        await AuthorizationAdmin(password)

        // Select symboil coin
        const coinType = id_currency === 1 ? "BTC" : "ETH"

        // obtenemos los estados de redux
        const { updates } = store.getState()

        console.log(updates)

        // verificamos si ya han hecho trading
        if (updates.TRADING[coinType].date !== null) {
            // VERIFICAMOS SI HAN HECHO TRADING el dia de hoy
            if (moment().isSame(updates.TRADING[coinType].date, "d")) {
                throw String(`Trading [${coinType}] | Aplicado por ${updates.TRADING[coinType].author}`)
            }
        }

        // enviamos el evento que activa la modal
        socketAdmin.emit(eventSocketNames.onTogglePercentage, true)

        // obtenemos los datos del trading
        const response = await sql.run(getDataTrading, [id_currency])

        for (let index = 0; index < response[0].length; index++) {
            // Get data map item
            const { amount, email, name, id } = response[0][index]

            // obtenemos el monto de los upgrades del dia de hoy
            const dataSQLUpgrades = await sql.run(getUpgradeAmount, [NOW(), id])


            // creamos una constante que restara el monto de upgrades acumulados en el dia
            const amountSubstract = dataSQLUpgrades[0].amount !== null ? _.subtract(amount, dataSQLUpgrades[0].amount) : amount

            // Creamos el nuevo monto a depositar
            // `percentage (0.5 - 1)%`
            const newAmount = _.floor((percentage * amountSubstract) / 100, 8).toString()

            // Get HTML template with parans
            const html = await getHTML("trading.html", { name, percentage, newAmount, typeCoin: coinType })

            // Config send email
            const config = {
                from: EMAILS.DASHBOARD,
                to: email,
                subject: `Informe de Ganancias ${moment(NOW()).format('"DD-MM-YYYY"')}`,
                html,
            }

            // break de medio segundo
            await breakTime(500)

            // enviamos el correo
            await sendEmail(config)

            // Execute sql of payments register
            await sql.run(createPayment, [id, percentage, newAmount])

            const currentPercentageValue = (((index + 1) / response[0].length) * 100).toFixed(2)

            // enviamos por socket el porcentaje de los pagados
            socketAdmin.emit(eventSocketNames.setPercentageCharge, { currentPercentageValue, name, title: "Aplicando Trading" })

            console.log(`${currentPercentageValue}% | Trading applied`)
        }

        // enviamos el evento que oculta la modal
        socketAdmin.emit(eventSocketNames.onTogglePercentage, false)

        // despachamos al store de redux la ultima trading
        store.dispatch({
            type: reportTrading,
            coin: coinType,
            payload: {
                date: NOW(),
                author: user.email,
            }
        })

        // Send Success
        res.status(200).send({ response: 'success' })
    } catch (error) {
        log(`trading.admin.js | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router