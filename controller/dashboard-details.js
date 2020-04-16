const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const WriteError = require('../logs/write')

// Auth by token
const auth = require('../middleware/auth')

// Mysql
const query = require('../config/query')
const { getTotalPaid, getDataChart, getDetails, getProfits } = require('./queries')

const withPromises = (queryScript = '', params = []) => {
    return new Promise((resolve, reject) => {
        query(queryScript, params, (response) => {
            resolve(response)
        }).catch(reason => reject(reason))
    })
}

router.get('/', (_, res) => res.status(500))

router.post('/', [
    auth, [
        check('user_id', 'User ID is required'),
        check('currency_id', 'Currency ID is required'),
    ]
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors)

        return res.json({
            error: true,
            message: errors.array()[0].msg
        })
    }

    const { user_id, currency_id } = req.body

    try {
        // (1) consulta para extraer datos del componente HeaderDashboard
        const responseHeaderDashboar = await withPromises(getTotalPaid, [user_id, currency_id])

        // (2) consulta para extraer datos del dashboard
        // const responseDashboard = await executeQuery(getDataChart, [user_id, currency_id])

        // (3) consulta para extraer detalles del dashboard
        const responseDashboardDetails = await withPromises(getDetails, [user_id, currency_id])

        // (1) (4) consulta para extraer datos detalle de retiros/ ganancias totales
        const responseDashboardRetirement = await withPromises(getProfits, [user_id, currency_id])

        // Enviamos todos los resultados como un arreglos
        Promise.all([responseHeaderDashboar, responseDashboardDetails, responseDashboardRetirement])
            .then(values => res.status(200).send(
                [
                    values[0][0][0],
                    values[1][0][0],
                    values[2][0].length === 0 ? null : values[2][0]
                ]
            ))
            .catch(reason => {
                throw reason
            })

    } catch (error) {
        WriteError(`dashboard-details.js - catch execute query | ${error}`)

        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router