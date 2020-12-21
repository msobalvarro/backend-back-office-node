const router = require('express').Router()
const moment = require('moment')
require('moment/locale/es')

// import middleware
const { check, validationResult } = require('express-validator')

// import constants
const log = require('../../logs/write.config')
const sendEmail = require('../../configuration/send-email.config')
const { getHTML } = require('../../configuration/html.config')
const {
    socketAdmin,
    eventSocketNames,
    AuthorizationAdmin
} = require('../../configuration/constant.config')

// import sql
const sql = require("../../configuration/sql.config")
const {
    getReportUserDeliveryList,
    getHeaderReportUser,
    getHeaderReportUserCountReferred,
    getReportUserDuplicationPlanDetail,
    getReportUserCommissionPayment
} = require("../../configuration/queries.sql")

// import services
const reportUserPdf = require('../../services/user-report-pdf.service')


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

        const result = await getReportUserData(id, date).catch(error => {
            throw error
        })

        if (result.error) {
            throw String(result.message)
        }

        res.send(result)
    } catch (message) {
        log(`report-users.admin.controller.js | Error al generar reporte estado de cuenta de usuario | ${message.toString()}`)

        res.send({
            error: true,
            message
        })
    }
})


const checkDeliveryParams = [
    check("date", "Date Report is required").exists(),
    check("password", "Password Authorization is required").exists()
]

/**
 * Envía por correo los reportes de estado de cuenta a todos los usuarios
 * con planes activos
 */
router.post('/delivery', checkDeliveryParams, async (req, res) => {
    try {
        // Se verifica sí hay errores en los parámetros recibidos
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Obtiene la fecha del reporte
        const { date, password } = req.body
        let index = 0

        // Autenticamos al root admin
        await AuthorizationAdmin(password)

        // enviamos el evento que activa la modal
        socketAdmin.emit(eventSocketNames.onTogglePercentage, true)

        // Obtiene la lista de los usuarios a los que se enviarán los reportes
        const deliveryList = await sql.run(
            getReportUserDeliveryList,
            [`${moment(date).endOf('month').format('YYYY-MM-DD')} 23:59:59`]
        )

        for (let user of deliveryList) {
            // Se obtiene los datos del usuario actual
            const {
                id,
                email,
                fullname,
                btc,
                eth
            } = user

            // Se obtiene el porcentage de progreso
            const currentPercentageValue = (((index + 1) / deliveryList.length) * 100).toFixed(2)

            console.log('current report: ', fullname, ' => %', currentPercentageValue)

            // enviamos por socket el porcentaje de los reportes enviados
            socketAdmin.emit(eventSocketNames.setPercentageCharge, {
                currentPercentageValue,
                name: fullname,
                title: "Enviando Estados de Cuenta"
            })

            index++

            // Sí no posee planes activos, se pasa al siguiente usuario
            if (btc === 0 && eth === 0) {
                break
            }

            // Se crea la variable que almacenará los archivos de reporte a adjuntar
            const attachments = []

            // Se obtiene los datos base del reporte para ambas monedas
            const result = await getReportUserData(id, date)
            const {
                bitcoin: bitcoinData,
                ethereum: ethereumData
            } = result

            if (result.error) {
                throw String(result.message)
            }

            // Sí el usuario posee un plan de BTC, se genera el reporte para BTC
            if (btc === 1) {
                // Se genera el reporte de bitcoin en pdf
                const bitcoinReport = await reportUserPdf({
                    ...bitcoinData,
                    ...(eth === 1)
                        ? {}
                        : {
                            // Si no cuenta con plan de ETH, se compinan los pagos de las comisiones
                            commissionPayment: await mergeComissionsPayments(
                                bitcoinData.commissionPayment,
                                ethereumData.commissionPayment
                            )
                        }
                })

                if (bitcoinReport.error) {
                    throw String(bitcoinReport.message)
                }

                // Se adjunta el archivo generado
                attachments.push({
                    filename: getReportFilename(date, 1, fullname),
                    content: bitcoinReport,
                    contentType: 'application/pdf'
                })
            }


            // Sí el usuario posee un plan de ETH, se genera el reporte para ETH
            if (eth === 1) {
                // Se genera el reporte de ethereum en pdf
                const ethereumReport = await reportUserPdf({
                    ...ethereumData,
                    ...(btc === 1)
                        ? {}
                        : {
                            // Si no cuenta con plan de BTC, se compinan los pagos de las comisiones
                            commissionPayment: await mergeComissionsPayments(
                                bitcoinData.commissionPayment,
                                ethereumData.commissionPayment
                            )
                        }
                })

                if (ethereumReport.error) {
                    throw String(ethereumReport.message)
                }

                // Se adjunta el archivo generado
                attachments.push({
                    filename: getReportFilename(date, 2, fullname),
                    content: ethereumReport,
                    contentType: 'application/pdf'
                })
            }

            // Se generan los datos a renderizar dentro de la plantilla html
            const dataHTML = {
                name: fullname,
                date: `${moment(date).format('MMMM')} de ${moment(date).format('YYYY')}`
            }

            // Se obtiene el contenido del html a enviar junto con los reportes
            const html = await getHTML('user-report.html', dataHTML)

            // Se envía la notificación del reporte y se adjuntan los archivos generados
            await sendEmail({
                from: 'gerencia@alysystem.com',
                to: email,
                subject: 'Estados de cuenta',
                html,
                attachments
            })
        }
        console.log('finished report delivery')

        res.send({
            response: 'success'
        })
    } catch (message) {
        log(`report-users.admin.controller.js | Error al enviar los reporte estado de cuenta de usuario | ${message.toString()}`)

        res.send({
            error: true,
            message
        })
    } finally {
        // enviamos el evento que oculta la modal
        socketAdmin.emit(eventSocketNames.onTogglePercentage, false)
    }
})


/**
 * Función para generar el nombre del archivo del reporte
 * @param {String} date - Fecha del inicio del reporte 
 * @param {Number} coinType - Tipo de moneda (1=btc, 2=eth) 
 * @param {String} fullname - Nombre completo del usuario
 * @return {String}
 */
const getReportFilename = (date, coinType, fullname) => {
    const month = moment(date).format('MM')
    const year = moment(date).format('YY')
    const coin = (coinType === 1 ? 'BTC' : 'ETH')

    return `${month}${year}.EC_${coin} ${fullname}`
}

/**
 * Combina la lista de pagos de las monedas en una sola lista
 * @param {Array} btcCommissions - Lista con los pagos de comisiones de BTC
 * @param {Array} ethCommissions - Lista con los pagos de comisiones de ETH
 * @return {Array}
 */
const mergeComissionsPayments = (btcCommissions, ethCommissions) =>
    new Promise((resolve, _) => {
        const result = [
            ...btcCommissions,
            ...ethCommissions
        ]

        resolve(result.sort((a, b) =>
            (new Date(a.registration_date) - new Date(b.registration_date))
        ))
    })

/**
 * Retorna la duración de una fecha en milisegundos
 * @param {String} date - fecha a procesar
 * @return {Number}
 */
const dateDuration = (date) => {
    const _date = moment(date)

    return moment.duration(_date).asMilliseconds()
}


/**
 * Obtiene los datos del reporte para un usuario
 * @param {Number} id - id del usuario 
 * @param {String} date - fecha del reporte
 * @return {Promise}
 */
const getReportUserData = (id, date) => new Promise(async (resolve, _) => {
    try {
        // Se calcula la fecha de inicio y corte del reporte
        const startDate = moment(date).format('YYYY-MM-DD')
        const cutoffDate = moment(date).endOf('month').format('YYYY-MM-DD')

        // Parámetros del proc sql
        const sqlDuplicationParams = [`${startDate} 23:59:59`, id]
        const sqlCommissionPaymentsParams = [
            id,
            `${startDate} 23:59:59`,
            `${cutoffDate} 23:59:59`
        ]

        // Obtiene la información de la cabecera del reporte para ambas monedas
        const resultHeaderInfoBTC = await sql.run(
            getHeaderReportUser,
            [id, `${cutoffDate} 23:59:59`, 1]
        )

        const resultHeaderInfoETH = await sql.run(
            getHeaderReportUser,
            [id, `${cutoffDate} 23:59:59`, 2]
        )

        // Obtine la cantida de referidos con los que cuenta el usuario
        const resultReferredUser = await sql.run(
            getHeaderReportUserCountReferred,
            [id, `${cutoffDate} 23:59:59`]
        )
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


        // Obtiene los precios de las monedas al cierre
        const resultCoinsPrices = await sql.run(
            "select * from coin_price cp where date_price = ?",
            [cutoffDate]
        )

        const { eth_price, btc_price } = resultCoinsPrices[0]
        const infoBtc = resultHeaderInfoBTC[0][0]
        const infoEth = resultHeaderInfoETH[0][0]

        resolve({
            bitcoin: {
                info: {
                    ...infoBtc,
                    referred: referredCounter,
                    startDate,
                    cutoffDate,
                    price: btc_price
                },
                duplicationPlan: resultDuplicationBTC[0]
                    .sort((a, b) => (dateDuration(a.date) - dateDuration(b.date))),
                commissionPayment: resultCommissionPaymentBTC
            },

            ethereum: {
                info: {
                    ...infoEth,
                    referred: referredCounter,
                    startDate,
                    cutoffDate,
                    price: eth_price
                },
                duplicationPlan: resultDuplicationETH[0]
                    .sort((a, b) => (dateDuration(a.date) - dateDuration(b.date))),
                commissionPayment: resultCommissionPaymentETH
            }
        })
    } catch (message) {
        resolve({
            error: true,
            message
        })
    }
})

module.exports = router