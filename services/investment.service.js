// import sql services
const sql = require("../configuration/sql.config")
const { checkStartDateInvestment, getDataInvestment } = require("../configuration/queries.sql")

// import constants and functions
const moment = require("moment")

/**Lista de servicios para planes */
const investmentService = {}

/**
 * @author msobalvarro
 * @summary Metodo que obtiene la fecha de creacion de un plan
 * @param {Number} id_investment
 * @returns Date
 * */
investmentService.getDateCreate = (id = 0) => new Promise(async (res, rej) => {
    try {
        // verificamos si es diferente al dato default
        if (id === 0) {
            throw String("ID investment is required")
        }

        // buscamos la fecha 
        const responseDateRegisterPlan = await sql.run(checkStartDateInvestment, [id])

        // verificamos si existe el plan
        if (!responseDateRegisterPlan.length) {
            throw String("No se ha podido obtener la fecha")
        }

        res(responseDateRegisterPlan[0].start_date)
    } catch (error) {
        rej(error)
    }
})

investmentService.getDataInfo = (id = 0) => new Promise(async (res, rej) => {
    try {
        // verificamos si es diferente al dato default
        if (id === 0) {
            throw String("ID investment is required")
        }

        // buscamos la fecha 
        const responseDateRegisterPlan = await sql.run(getDataInvestment, [id])

        // verificamos si existe el plan en la base de datos
        if (!responseDateRegisterPlan.length) {
            res(null)
        }

        const dataStruc = {
            id: responseDateRegisterPlan[0].id,
            coin: {
                id: responseDateRegisterPlan[0].id_currency,
                symbol: responseDateRegisterPlan[0].id_currency === 1 ? "BTC" : "ETH",
            },
            date: responseDateRegisterPlan[0].start_date,
            amount: responseDateRegisterPlan[0].amount,
            state: {
                approved: responseDateRegisterPlan[0].approved === 1,
                enabled: responseDateRegisterPlan[0].enabled === 1,
            },
            transaction: {
                type: (responseDateRegisterPlan[0].alypay === 1) ? "ALYPAY" : (responseDateRegisterPlan[0].email_airtm !== null ? "AIRTM" : "CRYPTO"),
                alypay: responseDateRegisterPlan[0].alypay === 1,
                airtm: {
                    payment: responseDateRegisterPlan[0].email_airtm !== null,
                    amount: responseDateRegisterPlan[0].aproximate_amount,
                    email: responseDateRegisterPlan[0].email_airtm
                },
            },
        }

        res(dataStruc)
        // res(responseDateRegisterPlan[0])
    } catch (error) {
        rej(error)
    }
})

// export service
module.exports = investmentService