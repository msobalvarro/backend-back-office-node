const router = require('express').Router()

// import middleware
const { check, validationResult } = require('express-validator')

// import constants
const log = require('../../logs/write.config')

// import sql
const sql = require("../../configuration/sql.config")
const {
    getHeaderReportUser,
    getHeaderReportUserCountReferred,
    getReportUserDuplicationPlanDetail,
    getReportUserCommissionPayment
} = require("../../configuration/queries.sql")


const checkParams = [
    check("id", "Id user is required").isNumeric().exists(),
    check("date", "Date Report is required").exists()
]

/**
 * Controlador para obtener los datos para generar el estado de cuenta de las inversione
 * de un cliente
 */
router.post('/', checkParams, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Se extraen los datos necesarios para generar el reporte
        const {
            id,
            date
        } = req.body

        // Parámetros del proc sql
        const sqlDuplicationParams = [date, id]
        const sqlCommissionPaymentsParams = [id, date, date]

        // Obtiene la información de la cabecera del reporte para ambas monedas
        const resultHeaderInfoBTC = await sql.run(
            getHeaderReportUser,
            [id, 1]
        )

        const resultHeaderInfoETH = await sql.run(
            getHeaderReportUser,
            [id, 2]
        )

        // Obtine la cantida de referidos con los que cuenta el usuario
        const resultReferredUser = await sql.run(getHeaderReportUserCountReferred, [id])
        let referredCounter = 0

        if (resultReferredUser[0].length > 0) {
            // Calcula el total de referidos en las dos monedas
            referredCounter = resultReferredUser[0]
                .map(({ cant_referred }) => cant_referred)
                .reduce((prev, next) => prev + next, 0)
        }

        // Obtiene los datos del plan de duplicación para BTC
        const resultDuplicationBTC = await sql.run(
            getReportUserDuplicationPlanDetail,
            [...sqlDuplicationParams, 1]
        )

        // Obtiene los datos del plan de duplicación para ETH
        const resultDuplicationETH = await sql.run(
            getReportUserDuplicationPlanDetail,
            [...sqlDuplicationParams, 2]
        )

        // Obtiene los datos de los pagos de comisionesm para BTC
        const resultCommissionPaymentBTC = await sql.run(
            getReportUserCommissionPayment,
            [...sqlCommissionPaymentsParams, 'CBTC']
        )

        // Obtiene los datos de los pagos de comisiones para ETH
        const resultCommissionPaymentETH = await sql.run(
            getReportUserCommissionPayment,
            [...sqlCommissionPaymentsParams, 'CETH']
        )


        res.send({
            bitcoin: {
                info: {
                    ...resultHeaderInfoBTC[0],
                    referred: referredCounter
                },
                duplicationPlan: resultDuplicationBTC[0],
                commissionPayment: resultCommissionPaymentBTC
            },

            ethereum: {
                info: {
                    ...resultHeaderInfoETH[0],
                    referred: referredCounter
                },
                duplicationPlan: resultDuplicationETH[0],
                commissionPayment: resultCommissionPaymentETH
            }
        })
    } catch (message) {
        log(`report-users.admin.controller.js | Error al generar reporte estado de cuenta de usuario | ${message.toString()}`)

        res.send({
            error: true,
            message
        })
    }
})

module.exports = router