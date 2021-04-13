const moment = require('moment')

// import sql
const sql = require('../configuration/sql.config')
const {
    getReportUserDeliveryList,
    getHeaderReportUser,
    getHeaderReportUserCountReferred,
    getReportUserDuplicationPlanDetail,
    getReportUserCommissionPayment,
} = require('../configuration/queries.sql')

const reportUserPdf = require('./user-report-pdf.service')

const ReportUserService = {}

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
    const coin = coinType === 1 ? 'BTC' : 'ETH'

    return `${month}${year}.EC_${coin} ${fullname}.pdf`
}

/**
 * Combina la lista de pagos de las monedas en una sola lista
 * @param {Array} btcCommissions - Lista con los pagos de comisiones de BTC
 * @param {Array} ethCommissions - Lista con los pagos de comisiones de ETH
 * @return {Array}
 */
const mergeComissionsPayments = (btcCommissions, ethCommissions) =>
    new Promise((resolve, _) => {
        const result = [...btcCommissions, ...ethCommissions]

        resolve(
            result.sort(
                (a, b) =>
                    new Date(a.registration_date) -
                    new Date(b.registration_date)
            )
        )
    })

/**
 * Retorna la duración de una fecha en milisegundos
 * @param {String} date - fecha a procesar
 * @return {Number}
 */
const dateDuration = date => {
    const _date = moment(date)

    return moment.duration(_date).asMilliseconds()
}

/**
 * Ordena la lista de las duplicaciones recibidas
 * @param {Array} _data
 * @return {Array}
 */
const sortDuplicationPlan = _data =>
    new Promise((resolve, _) => {
        // Sí no hay datos, se termina la ejecución
        if (_data.length === 0) {
            resolve(_data)
        }

        // Se extrae el saldo inicial para añadirlo al principio
        const SI = _data.filter(item => item.codigo === 'SI')[0]

        // Se ordena el resto de los elementos que no pertenecen al saldo inicial
        _data = _data
            .filter(item => item.codigo !== 'SI')
            .sort((a, b) => dateDuration(a.date) - dateDuration(b.date))

        // Se construye la nueva lista de duplicación ya ordenada
        resolve([SI, ..._data])
    })

/**
 * Obtiene la lista de los usuarios que poseen inversiones activas dentro
 * del periodo del cual se generará el reporte
 * @param {Date} date - fecha de corte del reporte
 */
ReportUserService.getDeliveryList = function (date) {
    return new Promise(async (resolve, reject) => {
        try {
            const cutoffDate = `${moment(date)
                .endOf('month')
                .format('YYYY-MM-DD')} 23:59:59`

            const response = await sql.run(getReportUserDeliveryList, [
                cutoffDate,
            ])

            resolve(response)
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Obtiene los datos del reporte para un usuario
 * @param {Number} id - id del usuario
 * @param {String} date - fecha del reporte
 * @return {Promise}
 */
ReportUserService.getReportUserData = function (id, date) {
    return new Promise(async (resolve, _) => {
        try {
            // Se calcula la fecha de inicio y corte del reporte
            const startDate = moment(date).format('YYYY-MM-DD')
            const cutoffDate = moment(date).endOf('month').format('YYYY-MM-DD')

            // Parámetros del proc sql
            const sqlDuplicationParams = [`${startDate} 00:00:00`, id]
            const sqlCommissionPaymentsParams = [
                id,
                `${startDate} 00:00:00`,
                `${cutoffDate} 23:59:59`,
            ]

            // Obtiene la información de la cabecera del reporte para ambas monedas
            const resultHeaderInfoBTC = await sql.run(getHeaderReportUser, [
                id,
                `${cutoffDate} 23:59:59`,
                1,
            ])

            const resultHeaderInfoETH = await sql.run(getHeaderReportUser, [
                id,
                `${cutoffDate} 23:59:59`,
                2,
            ])

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
                'select * from coin_price cp where date_price = ?',
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
                        price: btc_price,
                    },
                    duplicationPlan: await sortDuplicationPlan(
                        resultDuplicationBTC[0]
                    ),
                    commissionPayment: resultCommissionPaymentBTC,
                },

                ethereum: {
                    info: {
                        ...infoEth,
                        referred: referredCounter,
                        startDate,
                        cutoffDate,
                        price: eth_price,
                    },
                    duplicationPlan: await sortDuplicationPlan(
                        resultDuplicationETH[0]
                    ),
                    commissionPayment: resultCommissionPaymentETH,
                },
            })
        } catch (message) {
            resolve({
                error: true,
                message,
            })
        }
    })
}

/**
 * Genera los archivos pdf del reporte que se adjuntarán en el correo
 * @param {Object} bitcoin - datos del plan de bitcoin
 * @param {Object} ethereum - datos del plan de ethereum
 * @param {Number} btc - valor que indica sí el usuario posee plan bitcoin
 * @param {Number} eth - valor que indica sí el usuario posee plan ehereum
 */
ReportUserService.generateReportUserPdf = function ({
    bitcoin,
    ethereum,
    btc,
    eth,
    fullname,
    date,
}) {
    return new Promise(async (resolve, reject) => {
        try {
            // constante que almacenará los archivos generados
            const attachments = []

            // Sí el usuario posee un plan de BTC, se genera el reporte para BTC
            if (btc === 1) {
                // Se genera el reporte de bitcoin en pdf
                const bitcoinReport = await reportUserPdf({
                    ...bitcoin,
                    ...(eth === 1
                        ? {}
                        : {
                              // Si no cuenta con plan de ETH, se compinan los pagos de las comisiones
                              commissionPayment: await mergeComissionsPayments(
                                  bitcoin.commissionPayment,
                                  ethereum.commissionPayment
                              ),
                          }),
                })

                if (bitcoinReport.error) {
                    throw String(bitcoinReport.message)
                }

                // Se adjunta el archivo generado
                attachments.push({
                    filename: getReportFilename(date, 1, fullname),
                    content: bitcoinReport,
                    contentType: 'application/pdf',
                })
            }

            // Sí el usuario posee un plan de ETH, se genera el reporte para ETH
            if (eth === 1) {
                // Se genera el reporte de ethereum en pdf
                const ethereumReport = await reportUserPdf({
                    ...ethereum,
                    ...(btc === 1
                        ? {}
                        : {
                              // Si no cuenta con plan de BTC, se compinan los pagos de las comisiones
                              commissionPayment: await mergeComissionsPayments(
                                  bitcoin.commissionPayment,
                                  ethereum.commissionPayment
                              ),
                          }),
                })

                if (ethereumReport.error) {
                    throw String(ethereumReport.message)
                }

                // Se adjunta el archivo generado
                attachments.push({
                    filename: getReportFilename(date, 2, fullname),
                    content: ethereumReport,
                    contentType: 'application/pdf',
                })
            }

            resolve(attachments)
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = ReportUserService
