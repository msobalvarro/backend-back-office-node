const express = require('express')
const router = express.Router()

// import constants and functions
const { Workbook } = require("excel4node")
const log = require('../../logs/write.config')

// mysql configuration
const sql = require("../../configuration/sql.config")
const { getReportsUpgrades } = require("../../configuration/queries.sql")

/** Controlador que sirve un Archivo excel con los reportes de upgrades con rangos de fecha */
router.get('/upgrades', async (req, res) => {
    try {
        console.log(req.params)

        const workbook = new Workbook()
        const worksheet = workbook.addWorksheet('Reports')

        const dataSQL = await sql.run(getReportsUpgrades)

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
    } catch (error) {
        /**Error information */
        log(`report.admin.controller.js | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }

})

module.exports = router