const express = require('express')
const router = express.Router()

// import constants and functions
const log = require('../../logs/write.config')
const { Workbook } = require("excel4node")
const { NOW } = require("../../configuration/constant.config")

// mysql configuration
const sql = require("../../configuration/sql.config")
const { getReportsUpgrades, getReportsPayments, getReportMoneyChanger } = require("../../configuration/queries.sql")

/** Controlador que sirve un Archivo excel con los reportes de upgrades con rangos de fecha */
router.get('/upgrades', async (req, res) => {
    try {
        const { from, to } = req.query

        const workbook = new Workbook()
        const worksheet = workbook.addWorksheet('Reports')

        const dataSQL = await sql.run(getReportsUpgrades, [from ? new Date(from) : NOW(), to ? new Date(to) : NOW(),])

        // Set value of cell B1 to 300 as a number type styled with paramaters of style
        worksheet.cell(1, 1).string("Nombre")
        worksheet.cell(1, 2).string("Monto")
        worksheet.cell(1, 3).string("Moneda")
        worksheet.cell(1, 4).string("Fecha")

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

        const workbook = new Workbook()
        const worksheet = workbook.addWorksheet('Reports')

        const dataSQL = await sql.run(getReportsPayments, [from ? new Date(from) : NOW(), to ? new Date(to) : NOW(),])

        // Set value of cell B1 to 300 as a number type styled with paramaters of style
        worksheet.cell(1, 1).string("Nombre")
        worksheet.cell(1, 2).string("Monto")
        worksheet.cell(1, 3).string("Moneda")
        worksheet.cell(1, 2).string("Porcentaje")
        worksheet.cell(1, 4).string("Fecha")

        for (let index = 0; index < dataSQL.length; index++) {
            const element = dataSQL[index]

            // Set value of cell B1 to 300 as a number type styled with paramaters of style
            worksheet.cell(index + 2, 1).string(element.name)
            worksheet.cell(index + 2, 2).number(element.amount)
            worksheet.cell(index + 2, 3).string(element.currency === 1 ? "BTC" : "ETH")
            worksheet.cell(index + 2, 3).number(element.percentage)
            worksheet.cell(index + 2, 4).date(element.date)
        }


        workbook.write('Payments Reports.xlsx', res)
    } catch (message) {
        /**Error information */
        log(`report.admin.controller.js | Payments reports | ${error}`)

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

        const dataSQL = await sql.run(getReportMoneyChanger, [from ? new Date(from) : NOW(), to ? new Date(to) : NOW(),])

        // Set value of cell B1 to 300 as a number type styled with paramaters of style
        worksheet.cell(1, 1).string("Tipo")
        worksheet.cell(1, 2).string("Moneda")
        worksheet.cell(1, 3).string("Precio Moneda")
        worksheet.cell(1, 4).string("Monto USD")
        worksheet.cell(1, 5).string("Monto")
        worksheet.cell(1, 6).string("ID de manipulación")
        worksheet.cell(1, 7).string("Correo Airtm")
        worksheet.cell(1, 8).string("Wallet")
        worksheet.cell(1, 9).string("Hash de transacción")
        worksheet.cell(1, 10).string("Fecha")

        for (let index = 0; index < dataSQL.length; index++) {
            const element = dataSQL[index]

            // Set value of cell B1 to 300 as a number type styled with paramaters of style
            worksheet.cell(index + 2, 1).string(element.type === "buy" ? "Compra" : "Venta")
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
        log(`report.admin.controller.js | Money Changer reports | ${error}`)

        res.send({ error: true, message })
    }

})

module.exports = router