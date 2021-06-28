// import sql services
const sql = require("../configuration/sql.config")
const {
    checkStartDateInvestment,
    getDataInvestment,
    getTotalAmountUogrades,
    getTotalMonthUpgrades
} = require("../configuration/queries.sql")

// import constants and functions
const moment = require("moment")
const _ = require("lodash")

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

/**
 * @summary Metodo que retorna la informacion de un plan especifico
 * @author msobalvarro
 * @param {*} id 
 * @returns 
 */
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

/**
 * @summary servicio que obtiene los upgrades del mes
 * @param {*} id 
 * @returns 
 */
investmentService.getLastTransactions = (id = 0) => new Promise(async (res, rej) => {
    try {
        // get dataSQL
        const dataSQL = await sql.run(getTotalMonthUpgrades, [id])

        // array strcuture
        const strcutured = []

        // mapping
        _.map(dataSQL, i => {
            strcutured.push({
                // fecha
                date: i.fecha,

                // datos del usuario
                user: {
                    id: i.id_users,
                    name: i.nombre_inversor,
                    email: i.email,
                },

                // los datos de la transaccion
                transaction: {
                    // id Investment
                    investment: i.id_investment,

                    //tipo de transaccion // Compra // upgrade
                    type: i.transaccion.toUpperCase(),

                    // moneda con la cual se hizo la transaccion
                    coin: i.moneda,

                    // fracciones de moneda
                    amount: i.monto,

                    // monto equivalente a dollar
                    amountUSD: i.monto_usd,

                    // transaccion con alypay
                    alypay: i.alypay === 1,

                    // hash de transaccion
                    hash: i.hash,
                }
            })
        })

        // resovle
        res(strcutured)
    } catch (error) {
        rej(error)
    }
})

investmentService.getTotalUpgrades = (id = 0) => new Promise(async (res, rej) => {
    try {
        const totalAmount = await run(getTotalAmountUogrades, [id])

        // aca almacenaremos 
        const totalMonth = _.sumBy(totalAmount, "monto_usd") || 0

        res(totalMonth.toFixed(2))
    } catch (error) {
        rej(error)
    }
})

// export service
module.exports = investmentService