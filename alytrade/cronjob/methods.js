const { QueryTypes } = require('sequelize')
const { sequelize } = require('../../configuration/sql.config')
const models = require('../../models')
/**
 * Get date from MySQL server
 * @returns {Promise<Date>} a Date object with the server's date
 */
const getServerDate = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const dateQuery = "select now() as fecha"
            const resultDate = await sequelize.query(dateQuery, { plain: true, type: QueryTypes.SELECT })
            const { fecha } = resultDate
            resolve(fecha)
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * @method getInvestmentData - Get useful data to calculate interests
 * @param {Number} investmentId - is the id of investment in Database
 * @returns {Promise<{start_date:Date,amount:Number,investmentplans_id:Number}>} a object with start_date, amount and investmentplans_id of investmentId
 */
const getInvestmentData = (investmentId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const query = `select i.start_date,i.amount,aip.investmentplans_id from investment i 
                            inner join alytrade_investment_plan aip on i.id = aip.investment_id and aip.expired=0
                            where i.id  = ?`
            const result = await sql.run(query, [investmentId])
            const { start_date, amount, investmentplans_id } = result[0]
            resolve({ start_date, amount, investmentplans_id })
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * Get Alytrade's investments plans
 * @returns {Promise<[{id:number,description:string,percentage:number,months:number, currency_id:number}]>} Returns an array with Alytrade's plans of investments 
 */
const getCatalog = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const ds = (await models.AlytradeInvestmentPlansCatalogModel.findAll({
                attributes: ['id', 'description', 'percentage', 'months', 'currency_id']
            })).map(item => item.toJSON())
            resolve(ds)
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * @method existInterestRow - Verify if already exists a investment row in a date
 * @param {Number} investmentId is the id of investment in Database
 * @param {Date} date is a Date object to compare the row date
 * @returns {boolean} TRUE if already exists a interest row at that date in other case return FALSE
 */
const existInterestRow = (investmentId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            const count = await models.AlytradeInvestmentInterestModel.count({
                where: {
                    date: date,
                    investment_id: investmentId
                }
            })

            resolve(count > 0 ? true : false)
        } catch (err) {
            reject(err)
        }
    })
}

/**
 *  
 * @method insertInterestQuery - Method to insert Interest row in Database
 * @param {number} investmentId 
 * @param {number} interest 
 * @param {number} approved 
 * @param {Date} date 
 * @returns {Promise<Boolean>} TRUE if insertion was successful in other case FALSE
 */
const insertInterestQuery = (investmentId, interest, approved, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            const existInterest = await existInterestRow(investmentId, date)
            //console.log({ existInterest, investmentId, date })
            if (existInterest) {
                //console.log("Ya hay un registro de interes para esa fecha")
                resolve(false)
                return
            }
            await models.AlytradeInvestmentInterestModel.create({
                investment_id, amount, approved, date
            })
            resolve(true)
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * @method getUnexpiredInvestents - Get a list of unexpired Alytrade Investments
 * @returns {Promise<[{investmentId:number,start_date:Date, amount: number,investmentplans_id:number}]>} Returns a array with a list of unexpired investment from AlyTrade
 */
const getUnexpiredInvestents = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const raw = await models.InvestmentModel.findAll({
                raw: true,
                attributes: [['id', 'investmentId'], 'start_date', 'amount'],
                include: [{
                    as: 'plan',
                    attributes: ['investmentplans_id','months'],
                    model: models.AlytradeInvestmentPlansModel,
                    where: {
                        expired: 0
                    },
                }]
            })

            resolve(raw.map(item => {
                return {
                    investmentId: item.investmentId,
                    start_date: item.start_date,
                    amount: item.amount,
                    investmentplans_id: item['plan.investmentplans_id'],
                    months: item['plan.months']
                }
            }))
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * Set an Alytrade Investment to expired
 * @param {Number} investmentId
 * @returns {Promise<boolean>} 
 */
const setInvestmentExpired = investmentId => {
    return new Promise(async (resolve, reject) => {
        try {
            const aip = await models.AlytradeInvestmentPlansModel.update({
                expired: 1
            }, {
                where: {
                    investment_id: investmentId
                }
            })

            resolve(aip[0] > 0)
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * Get an array with a list of months 
 * @param {Date} date Start date
 * @param {number} months amount of months to add 
 * @returns {[Date]} Returns an array with the list of paydays 
 */
const generatePayDays = (date, months) => {
    const days = []
    for (let i = 0; i < months; i++) {
        const payDay = moment(date).add((i + 1), 'M').toDate()
        days.push(payDay)
    }
    return days
}

/**
 * Verify if the server date is on paydays
 * @param {Date} serverDate - Date from server
 * @param {[Date]} payDays - payDays generated by generatePayDays method
 * @returns {true|undefined} true if the serverDate is on payDays else undefined
 */
const isAPayDay = (serverDate, payDays) => {
    const payDay = payDays.find(date => {
        const diffHours = moment(serverDate).diff(date, 'h')
        const diffDays = moment(serverDate).diff(date, 'd')
        return diffDays === 0 && diffHours >= 0
    })

    return payDay
}

/**
 * Verify if is a payday of a investment and insert the interest in database
 * @param {number} investmentId
 * @param {Date} start_date
 * @param {number} amount
 * @param {number} months
 * @param {Date} serverDate
 * @returns { { investmentId:number, result:{daysUntilExpire:number, setToExpired:boolean, isAPayDay:boolean}} | {investmentId:number, error: string,traceData: { start_date:Date, amount:number, investmentplans_id:number, serverDate:Date }}  } A object with information about the process's result
 */
const insertInterestProcess = (investmentId, start_date, amount, months, serverDate) => {
    return new Promise(async (resolve, reject) => {

        let result = {}
        try {
            const payDays = generatePayDays(start_date, months)

            const payDay = isAPayDay(serverDate, payDays)
            if (payDay) {

                const interest = Number(plan.percentage) * amount
                result.isAPayDay = await insertInterestQuery(investmentId, interest, 0, payDay)

                const expirationDate = payDays[payDays.length - 1]
                const daysUntilExpire = moment(expirationDate).diff(serverDate, 'd')
                result.daysUntilExpire = daysUntilExpire
                if (daysUntilExpire === 0) {
                    setInvestmentExpired(investmentId)
                    result.setToExpired = true
                }
            } else {
                result.isAPayDay = false
            }

            resolve({ investmentId, result })
        } catch (err) {
            reject({
                investmentId,
                error: err.message,
                traceData: { start_date, amount, investmentId, serverDate }
            })
        }
    })
}

module.exports = {
    getCatalog,
    getUnexpiredInvestents,
    getServerDate,
    insertInterestProcess
}
