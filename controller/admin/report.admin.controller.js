const express = require('express')
const router = express.Router()
const moment = require('moment')

// import constants and functions
const log = require('../../logs/write.config')
const { default: Axios } = require('axios')
const { Workbook } = require('excel4node')
const { NOW } = require('../../configuration/constant.config')
const { PRODUCTION, PORT } = require('../../configuration/vars.config')

// mysql configuration
const sql = require('../../configuration/sql.config')
const {
    getReportsUpgrades,
    getReportsPayments,
    getReportMoneyChanger,
    getReportExchange,
} = require('../../configuration/queries.sql')

const workbook = new Workbook()

/** Controlador que sirve un Archivo excel con los reportes de upgrades con rangos de fecha */
router.get('/upgrades', async (req, res) => {
    try {
        const { from, to } = req.query

        const worksheet = workbook.addWorksheet('Reports')

        const dataSQL = await sql.run(getReportsUpgrades, [
            from ? new Date(from) : NOW(),
            to ? new Date(to) : NOW(),
        ])

        // Set value of cell B1 to 300 as a number type styled with paramaters of style
        worksheet.cell(1, 1).string('Nombre')
        worksheet.cell(1, 2).string('Monto')
        worksheet.cell(1, 3).string('Moneda')
        worksheet.cell(1, 4).string('Fecha')

        for (let index = 0; index < dataSQL.length; index++) {
            const element = dataSQL[index]

            // Set value of cell B1 to 300 as a number type styled with paramaters of style
            worksheet.cell(index + 2, 1).string(element.name)
            worksheet.cell(index + 2, 2).number(element.amount)
            worksheet.cell(index + 2, 3).string(element.coin)
            worksheet.cell(index + 2, 4).date(element.date)
        }

        workbook.write('Upgrades Reports.xlsx', res)
    } catch (message) {
        /**Error information */
        log(`report.admin.controller.js | upgrades Reports | ${error}`)

        res.send({ error: true, message })
    }
})

/** Controlador que sirve un Archivo excel con los reportes de upgrades con rangos de fecha */
router.get('/payments', async (req, res) => {
    try {
        const { from, to } = req.query

        const worksheet = workbook.addWorksheet('Payments')

        const dataSQL = await sql.run(getReportsPayments, [
            from ? new Date(from) : NOW(),
            to ? new Date(to) : NOW(),
        ])

        // Set value of cell B1 to 300 as a number type styled with paramaters of style
        worksheet.cell(1, 1).string('Nombre')
        worksheet.cell(1, 2).string('Monto')
        worksheet.cell(1, 3).string('Moneda')
        worksheet.cell(1, 4).string('Porcentaje')
        worksheet.cell(1, 5).string('Fecha')

        for (let index = 0; index < dataSQL.length; index++) {
            const element = dataSQL[index]

            // Set value of cell B1 to 300 as a number type styled with paramaters of style
            worksheet.cell(index + 2, 1).string(element.name)
            worksheet.cell(index + 2, 2).number(element.amount)
            worksheet
                .cell(index + 2, 3)
                .string(element.currency === 1 ? 'BTC' : 'ETH')
            worksheet.cell(index + 2, 4).number(element.percentage)
            worksheet.cell(index + 2, 5).date(element.date)
        }

        workbook.write('Payments Reports.xlsx', res)
    } catch (message) {
        /**Error information */
        log(`report.admin.controller.js | Payments reports | ${error}`)

        res.send({ error: true, message })
    }
})

/**
 * Controlador que genera un archivo excel con la lista de reportes de pagos
 */
router.get('/payments/excel', async (req, res) => {
    try {
        const url = `${PRODUCTION ? 'https' : 'http'}://${req.hostname}${
            PRODUCTION ? '' : ':' + PORT
        }/admin/payments/`

        const config = {
            headers: {
                'x-auth-token': req.header('x-auth-token'),
            },
        }

        // ejecutamos multiples peticiones
        const dataResponse = await Axios.all([
            Axios.get(`${url}/1`, config),
            Axios.get(`${url}/2`, config),
        ])

        const { data: dataBTC } = dataResponse[0]

        console.log('Procesando datos de Bitcoin')
        console.time('Bitcoin')

        // Creamos las hojas de excel Bitcoin
        const worksheetBTC = workbook.addWorksheet('Bitcoin')

        // cargamos las columnas
        // Set value of cell B1 to 300 as a number type styled with paramaters of style
        worksheetBTC.cell(1, 1).string('Nombre')
        worksheetBTC.cell(1, 2).string('Monto')
        worksheetBTC.cell(1, 3).string('Comisión de retiro')
        worksheetBTC.cell(1, 4).string('Moneda')
        worksheetBTC.cell(1, 5).string('Wallet')
        worksheetBTC.cell(1, 6).string('Hash')
        worksheetBTC.cell(1, 7).string('AlyPay')

        // mapeamos los reportes de pago
        for (let i = 0; i < dataBTC.length; i++) {
            const element = dataBTC[i]

            worksheetBTC.cell(i + 2, 1).string(element.name)
            worksheetBTC.cell(i + 2, 2).number(element.amount)
            worksheetBTC
                .cell(i + 2, 3)
                .number(element.comission === null ? 0 : element.comission)
            worksheetBTC.cell(i + 2, 4).string('BTC')
            worksheetBTC.cell(i + 2, 5).string(element.wallet)
            worksheetBTC
                .cell(i + 2, 6)
                .string(element.hash === null ? '' : element.hash)
            worksheetBTC
                .cell(i + 2, 7)
                .string(element.alypay === 1 ? 'Verificado' : 'Externa')
        }
        console.timeEnd('Bitcoin')

        console.log('Procesando datos de Ethereum')
        console.time('Ethereum')
        const { data: dataETH } = dataResponse[1]

        // Creamos las hojas de excel Bitcoin
        const worksheetETH = workbook.addWorksheet('Ethereum')

        worksheetETH.cell(1, 1).string('Nombre')
        worksheetETH.cell(1, 2).string('Monto')
        worksheetETH.cell(1, 3).string('Comisión de retiro')
        worksheetETH.cell(1, 4).string('Moneda')
        worksheetETH.cell(1, 5).string('Wallet')
        worksheetETH.cell(1, 6).string('Hash')
        worksheetETH.cell(1, 7).string('AlyPay')

        // traemos los reportes de pago en ethereum
        // mapeamos los reportes de pago
        for (let i = 0; i < dataETH.length; i++) {
            const element = dataETH[i]

            worksheetETH.cell(i + 2, 1).string(element.name)
            worksheetETH.cell(i + 2, 2).number(element.amount)
            worksheetETH
                .cell(i + 2, 3)
                .number(element.comission === null ? 0 : element.comission)
            worksheetETH.cell(i + 2, 4).string('ETH')
            worksheetETH.cell(i + 2, 5).string(element.wallet)
            worksheetETH
                .cell(i + 2, 6)
                .string(element.hash === null ? '' : element.hash)
            worksheetETH
                .cell(i + 2, 7)
                .string(element.alypay === 1 ? 'Verificado' : 'Externa')
        }

        console.timeEnd('Ethereum')

        workbook.write('file.xlsx', res)
    } catch (error) {
        log(
            `report.admin.controller.js | Payments reports excel list | ${error}`
        )

        res.send({ error: true, message })
    }
})

/**
 * Controlador para ejecutar reporte de money changer
 */
router.get('/money-changer', async (req, res) => {
    try {
        const { from, to } = req.query

        const workbook = new Workbook()
        const worksheet = workbook.addWorksheet('Reports')

        const dataSQL = await sql.run(getReportMoneyChanger, [
            from ? new Date(from) : NOW(),
            to ? new Date(to) : NOW(),
        ])

        // Set value of cell B1 to 300 as a number type styled with paramaters of style
        worksheet.cell(1, 1).string('Tipo')
        worksheet.cell(1, 2).string('Moneda')
        worksheet.cell(1, 3).string('Precio Moneda')
        worksheet.cell(1, 4).string('Monto USD')
        worksheet.cell(1, 5).string('Monto')
        worksheet.cell(1, 6).string('ID de manipulación')
        worksheet.cell(1, 7).string('Correo Airtm')
        worksheet.cell(1, 8).string('Wallet')
        worksheet.cell(1, 9).string('Hash de transacción')
        worksheet.cell(1, 10).string('Fecha')

        for (let index = 0; index < dataSQL.length; index++) {
            const element = dataSQL[index]

            // Set value of cell B1 to 300 as a number type styled with paramaters of style
            worksheet
                .cell(index + 2, 1)
                .string(element.type === 'buy' ? 'Compra' : 'Venta')
            worksheet.cell(index + 2, 2).string(element.coin_name)
            worksheet.cell(index + 2, 3).number(element.price_coin)
            worksheet.cell(index + 2, 4).number(element.amount_usd)
            worksheet.cell(index + 2, 5).number(element.amount_fraction)
            worksheet.cell(index + 2, 6).string(element.manipulation_id)
            worksheet.cell(index + 2, 7).string(element.email_airtm)
            worksheet.cell(index + 2, 8).string(element.wallet)
            worksheet.cell(index + 2, 9).string(element.hash)
            worksheet.cell(index + 2, 10).date(element.date)
        }

        workbook.write('Money Changer Reports.xlsx', res)
    } catch (message) {
        /**Error information */
        log(`report.admin.controller.js | Money Changer reports | ${error} `)

        res.send({ error: true, message })
    }
})

router.get('/exchange', async (req, res) => {
    try {
        // Se extrean elas fechas
        const {
            from = moment(NOW()).format('YYYY-MM-DD'),
            to = moment(NOW()).format('YYYY-MM-DD'),
        } = req.query

        const workbook = new Workbook()
        const worksheet = workbook.addWorksheet('Reports')

        // Se obtienen los datos del reporte
        const result = await sql.run(getReportExchange, [
            `${from} 00:00:00`,
            `${to} 23:59:59`,
        ])

        // Set value of cell B1 to 300 as a number type styled with paramaters of style
        worksheet.cell(1, 1).string('Moneda Origen')
        worksheet.cell(1, 2).string('Precio Moneda')
        worksheet.cell(1, 3).string('Monto Origen USD')
        worksheet.cell(1, 4).string('Monto Origen')
        worksheet.cell(1, 5).string('Moneda Destino')
        worksheet.cell(1, 6).string('Monto Destino')
        worksheet.cell(1, 7).string('Correo Usuario')
        worksheet.cell(1, 8).string('Wallet')
        worksheet.cell(1, 9).string('Hash de transacción')
        worksheet.cell(1, 10).string('Fecha')

        for (let index = 0; index < result.length; index++) {
            const element = result[index]

            // Set value of cell B1 to 300 as a number type styled with paramaters of style
            worksheet.cell(index + 2, 1).string(element.currency)
            worksheet.cell(index + 2, 2).number(element.coin_price)
            worksheet.cell(index + 2, 3).number(element.amount_usd)
            worksheet.cell(index + 2, 4).number(element.amount)
            worksheet.cell(index + 2, 5).string(element.target_currency)
            worksheet.cell(index + 2, 6).number(element.target_amount)
            worksheet.cell(index + 2, 7).string(element.email)
            worksheet.cell(index + 2, 8).string(element.wallet)
            worksheet.cell(index + 2, 9).string(element.hash)
            worksheet.cell(index + 2, 10).date(element.date)
        }

        workbook.write('Exchange Reports.xlsx', res)
    } catch (message) {
        log(`report.admin.controller.js | Exchange Report | ${message}`)

        res.send({
            error: true,
            message,
        })
    }
})

module.exports = router
