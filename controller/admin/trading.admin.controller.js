const express = require('express')
const router = express.Router()
const moment = require("moment")
const Crypto = require('crypto-js')
const _ = require("lodash")

// Import HTML Template Function
const { getHTML } = require("../../configuration/html.config")

// Email send api
const sendEmail = require("../../configuration/send-email.config")
const { EMAILS, NOW } = require("../../configuration/constant.config")
const { JWTSECRET } = require("../../configuration/vars.config")

// Write logs
const log = require('../../logs/write.config')

// import middlewares
const { check, validationResult } = require('express-validator')

// import redux configuration
const store = require("../../configuration/store/index.store")
const { setUpdates } = require("../../configuration/store/actions.json")

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

        const SQLResultSing = await sql.run(loginAdmin, [user.email, Crypto.SHA256(password, JWTSECRET).toString()])

        // verificamos si el usuario existe
        if (SQLResultSing[0].length === 0) {
            throw String("Contraseña Incorrecta")
        }

        // Select symboil coin
        const coinType = id_currency === 1 ? "BTC" : "ETH"

        // obtenemos los estados de redux
        const { updates: confirmUpdate } = store.getState()

        // verificamos si ya han hecho trading
        if (confirmUpdate.trading) {
            // VERIFICAMOS SI HAN HECHO TRADING el dia de hoy
            if (moment().isSame(confirmUpdate.trading[coinType], "d")) {
                throw String(`El Trading en ${coinType} ya esta aplicado por: ${user.email}`)
            }
        }

        const response = await sql.run(getDataTrading, [id_currency])

        for (let index = 0; index < 1; index++) {
            // Get data map item
            const { amount, email, name, id } = response[0][index]
            
            console.log(`Trading for ${name}`)


            console.log(`Aplicando Trading a ${name}`)
            console.time("trading")

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

            // Send Email api
            await sendEmail(config)

            // Execute sql of payments register
            await sql.run(createPayment, [id, percentage, newAmount])

            console.log("Trading applied")
        }

        const { updates: lastUpdate } = store.getState()

        // despachamos al store de redux la ultima trading
        store.dispatch({
            type: setUpdates,
            payload: {
                ...lastUpdate,
                trading: {
                    ...lastUpdate.trading,
                    [coinType]: NOW()
                }
            }
        })

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