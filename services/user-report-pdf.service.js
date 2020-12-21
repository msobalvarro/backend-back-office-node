const moment = require('moment')
const ejs = require('ejs')
const pdf = require('html-pdf')
const path = require('path')

// constants
const {
    floor,
    formatWallet
} = require('../configuration/constant.config')


/**
 * Genera los datos finales que se mostrarán en el reporte
 * @param {Object} data - datos base del reporte 
 */
const generatePdfData = (data) => new Promise(async (resolve, _) => {
    try {
        const {
            info,
            duplicationPlan,
            commissionPayment
        } = data

        // Almacena el monto del balance al cierre
        let lastBalance = 0
        // Almacena la sumatoria de los pagos de comisiones
        let commissionSum = 0
        // Almacena la sumatoria en dólares de los pagos de comisiones
        let commissionSumUsd = 0

        const duplications = duplicationPlan.map((item, index) => {
            // Sí es el primer elemento, se registra valor del balance inicial
            if (index === 0) {
                lastBalance = item.balance
            } else {
                // Se calcula el nuevo valor del balance, luego de los movimientos del día
                lastBalance = (lastBalance - item.debit + item.credit)

                item.balance = lastBalance
            }

            /**
             * Se configura el formato de la fecha y se redóndean los decimales de los 
             * montos que se mostrará en el pdf
             */
            item.date = moment(item.date).format('DD-MM-YYYY')
            item.percentage = floor(item.percentage, 3)
            item.daily_interest = floor(item.daily_interest, 8)
            item.debit = floor(item.debit, 8)
            item.credit = floor(item.credit, 8)
            item.balance = floor(item.balance, 8)

            return item
        })

        const commissions = commissionPayment.map(item => {
            // Se calcula el monto pagado al sponsor
            const sponsorAmount = item.fee_sponsor * item.amount
            const sponsorAmountUsd = sponsorAmount * item.price_coin

            commissionSum += sponsorAmount
            commissionSumUsd += sponsorAmountUsd

            /**
             * Se configura el formato de la fecha y se redóndean los decimales de los 
             * montos que se mostrará en el pdf
             */
            item.registration_date = moment(item.registration_date).format('DD-MM-YYYY')
            item.amount = floor(item.amount, 8)
            item.sponsorAmount = floor(sponsorAmount, 8)
            item.sponsorAmountUsd = floor(sponsorAmountUsd, 8)
            item.price_coin = floor(item.price_coin, 8)

            return item
        })


        /**
         * Se calcula la sección del summary
         */
        const { price } = info
        const paymentCode = (info.id_coin === 1) ? "CBTC" : "CETH"

        // Se separan los datos por categoría
        const summaryInt = duplicationPlan.filter(item => item.codigo === 'INT')
        const summaryRet = duplicationPlan.filter(item => item.codigo === 'RET')
        const summaryInv = duplicationPlan.filter(item => item.codigo === 'INV')
        const summaryNcr = duplicationPlan.filter(item => item.codigo === 'NCR')
        const summaryCommission = commissions.filter(item => item.code === paymentCode)

        // Se calculan los montos de cada categoría
        const summaryIntAmount = summaryInt.reduce((prev, item) => prev + item.daily_interest, 0)
        const summaryRetAmount = summaryRet.reduce((prev, item) => prev + item.debit, 0)
        const summaryInvAmount = summaryInv.reduce((prev, item) => prev + item.credit, 0)
        const summaryNcrAmount = summaryNcr.reduce((prev, item) => prev + item.credit, 0)
        const summaryCommissionAmount = summaryCommission.reduce((prev, item) => prev + item.sponsorAmount, 0)
        const summaryCommissionAmountUsd = summaryCommission.reduce((prev, item) => prev + item.sponsorAmountUsd, 0)

        // Se construyen los datos para la sección de resumen
        const summary = [
            {
                code: "INT",
                moviment: "interes del dia",
                count: summaryInt.length,
                amount: floor(summaryIntAmount, 8),
                amountUsd: floor(summaryIntAmount * price, 8)
            },
            {
                code: "RET",
                moviment: "retiro a wallet",
                count: summaryRet.length,
                amount: floor(summaryRetAmount, 8),
                amountUsd: floor(summaryRetAmount * price, 8)
            },
            {
                code: "INV",
                moviment: "inversion",
                count: summaryInv.length,
                amount: floor(summaryInvAmount, 8),
                amountUsd: floor(summaryInvAmount * price, 8)
            },
            {
                code: "NCR",
                moviment: "credito duplicacion",
                count: summaryNcr.length,
                amount: floor(summaryNcrAmount, 8),
                amountUsd: floor(summaryNcrAmount * price, 8)
            },
            {
                code: paymentCode,
                moviment: `comisiones referidos ${info.id_coin === 1 ? 'BTC' : 'ETH'}`,
                count: summaryCommission.length,
                amount: floor(summaryCommissionAmount, 8),
                amountUsd: floor(summaryCommissionAmountUsd, 8)
            }
        ]

        /**
         * Sí se detectan pagos de comisiones para ambas monedas, se calcula
         * el summary para la moneda faltante
         */
        if (commissions.length !== summaryCommission.length) {
            const commissionsExtraAmount = commissionSum - summaryCommissionAmount
            const commissionsExtraAmountUsd = commissionSumUsd - summaryCommissionAmountUsd

            summary.push({
                code: (info.id_coin === 1) ? "CETH" : "CBTC",
                moviment: `comisiones referidos ${info.id_coin === 1 ? 'ETH' : 'BTC'}`,
                count: commissions.length - summaryCommission.length,
                amount: floor(commissionsExtraAmount, 8),
                amountUsd: floor(commissionsExtraAmountUsd, 8)
            })
        }

        // Se retornan los datos a renderizar dentro de la plantilla del reporte
        resolve({
            info: {
                ...info,
                startDate: moment(info.startDate).format('DD MMMM YYYY'),
                cutoffDate: moment(info.cutoffDate).format('DD MMMM YYYY'),
                product: 'Plan de Inversión - Duplicación',
                wallet: formatWallet(info.wallet),
                plan: floor(info.plan, 8),
                duplicate_plan: floor(info.duplicate_plan, 8),
                commissionSum: floor(commissionSum, 8),
                commissionSumUsd: floor(commissionSumUsd, 8),
                lastBalance: floor(lastBalance, 8)
            },
            duplications,
            commissions,
            summary
        })
    } catch (message) {
        resolve({
            error: true,
            message
        })
    }
})


module.exports = (data) => new Promise(async (resolve, _) => {
    try {
        // Se generan los datos a renderizar dentro del pdf
        const pdfData = await generatePdfData(data)

        if (pdfData.error) {
            throw String(pdfData.message)
        }

        // Ruta de la plantilla del reporte
        const templatePath = path.join(__dirname, '../templates/user-report-pdf.ejs')

        // Se rederiza la plantilla
        ejs.renderFile(templatePath, pdfData, (error, result) => {
            if (error) {
                throw String(error)
            }

            // configuración para crear el pdf
            const options = {
                height: "377.6mm",
                width: "267mm",
                header: {
                    height: "8mm"
                },
                footer: {
                    height: '8mm'
                }
            }

            // Se crea el pdf a partir de la plantilla y se retorna como un buffer
            pdf.create(result, options).toBuffer((bufferError, buffer) => {
                if (bufferError) {
                    throw String(bufferError)
                }

                resolve(buffer)
            })
        })
    } catch (message) {
        resolve({
            error: true,
            message
        })
    }
})