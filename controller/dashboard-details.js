const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../logs/write')

// Auth by token
const auth = require('../middleware/auth')

// Mysql
const query = require('../config/query')
const queries = require('./queries')

router.get('/', (req, res) => res.status(500))

const executeQuery = (queryScript = '', params = []) => {
    return new Promise((resolve, reject) => {
        query(queryScript, params, (response) => resolve(response[0][0])).catch(reason => reject(reason))
    })
}

router.post('/', [
    auth, [
        check('user_id', 'User ID is required'),
        check('currency_id', 'Currency ID is required'),
    ]
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors)

        return res.status(500).json({
            error: true,
            message: errors.array()[0].msg
        })
    }

    const { user_id, currency_id } = req.body

    try {
        // (1) consulta para extraer datos del componente HeaderDashboard
        const responseHeaderDashboar = await executeQuery(queries.getTotalPaid, [user_id, currency_id])

        // (2) consulta para extraer datos del dashboard
        const responseDashboard = await executeQuery(queries.getDataChart, [user_id, currency_id])

        // (3) consulta para extraer detalles del dashboard
        const responseDashboardDetails = await executeQuery(queries.getDetails, [user_id, currency_id])

        // (1) (4) consulta para extraer datos detalle de retiros/ ganancias totales
        const responseDashboardRetirement = await executeQuery(queries.getProfits, [user_id, currency_id])

        // Enviamos todos los resultados como un arreglos
        Promise.all([responseHeaderDashboar, responseDashboard, responseDashboardDetails, responseDashboardRetirement])
            .then(values => res.send(values))
            .catch(reason => {
                throw reason
            })

    } catch (error) {
        WriteError(`dashboard-details.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.status(500).send(response)
    }
})

module.exports = router