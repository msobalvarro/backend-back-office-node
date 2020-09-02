const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../logs/write.config')

// Auth by token
const { auth } = require('../middleware/auth.middleware')

// Mysql
const query = require('../configuration/query.sql')
const { getTotalPaid, getDataChart, getDetails, getProfits } = require('../configuration/queries.sql')
const { default: validator } = require('validator')

const withPromises = (queryScript = '', params = []) => {
    return new Promise((resolve, reject) => {
        query(queryScript, params, (response) => {
            resolve(response)
        }).catch(reason => reject(reason))
    })
}

router.get('/', (_, res) => res.status(500))

router.post('/', [
    auth, [check('currency_id', 'Currency ID is required'),]
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors)

        return res.send({
            error: true,
            message: errors.array()[0].msg
        })
    }

    // get current id from params
    const { currency_id } = req.body

    // get user id from token
    const { id_user: user_id } = req.user

    try {
        // (1) consulta para extraer datos del componente HeaderDashboard
        const responseHeaderDashboard = await withPromises(getTotalPaid, [user_id, currency_id])

        // (2) consulta para extraer detalles del dashboard
        const responseDashboardDetails = await withPromises(getDetails, [user_id, currency_id])

        // (3) consulta para extraer datos detalle de retiros/ ganancias totales
        const responseDashboardRetirement = await withPromises(getProfits, [user_id, currency_id])

        const dataResponse = [
            responseHeaderDashboard[0][0],
            responseDashboardDetails[0][0],
            responseDashboardRetirement[0].length === 0 ? null : responseDashboardRetirement[0]
        ]

        res.send(dataResponse)

    } catch (error) {
        WriteError(`dashboard-details.controller.js | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

// controlador para obtener todo el historial de trading
router.get("/all-reports/:currency", auth, async (req, res) => {
    try {
        // get current id from params
        const { id_user } = req.user

        const { currency } = req.params

        // comprobamos si el parametro de currency es un numero
        if (!validator.isInt(currency)) {
            throw String("El parametro de la moneda no es correcto")
        }

        
        // (3) consulta para extraer datos detalle de retiros/ ganancias totales
        const responseDashboardRetirement = await withPromises(getProfits, [id_user, currency])


        res.send(responseDashboardRetirement[0])
    } catch (error) {
        WriteError(`dashboard-details.controller.js | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router