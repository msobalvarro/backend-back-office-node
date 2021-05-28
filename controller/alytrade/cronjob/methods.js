const sql = require('../../../configuration/sql.config')

/**
 * Get date from MySQL server
 * @returns {Promise<Date>} a Date object with the server's date
 */
const getServerDate = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const dateQuery = "select now() as fecha"
            const resultDate = await sql.run(dateQuery)
            const { fecha } = resultDate[0]
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
 * Get Alytrade's plans of investments 
 * @returns {Promise<[{id:number,description:string,percentage:number,months:number}]>} Returns an array with Alytrade's plans of investments 
 */
const getCatalog = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const sqlCatalog = "select id, description, percentage, months from alytrade_investmentplans_catalog"
            const ds = await sql.run(sqlCatalog)
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
            // DATE_FORMAT(date,"%Y-%m-%d") between DATE_ADD( DATE_FORMAT(?,"%Y-%m-%d"), INTERVAL -2 DAY) and DATE_ADD( DATE_FORMAT(?,"%Y-%m-%d"), INTERVAL 2 DAY)
            const query = `SELECT count(*) as count FROM alytrade_investment_interest aii WHERE
            DATE_FORMAT(date,"%Y-%m-%d") = DATE_FORMAT(?,"%Y-%m-%d")
            and investment_id  = ?`
            const result = await sql.run(query, [date, investmentId])
            const { count } = result[0]

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
            const sqlInsertAII = `INSERT INTO speedtradings.alytrade_investment_interest
            (investment_id, amount, approved,date)
            VALUES(?, ?, ?,?)`
            await sql.run(sqlInsertAII, [investmentId, interest, approved, date])
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
            const query = `select i.id as investmentId, i.start_date,i.amount,aip.investmentplans_id from investment i 
            inner join alytrade_investment_plan aip ON  i.id = aip.investment_id  and aip.expired  = 0`
            const result = await sql.run(query)
            resolve(result)
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
            const query = `update alytrade_investment_plan aip 
                        set expired = 1
                        where aip.investment_id = ?`
            const result = await sql.run(query, [investmentId])
            resolve(result)
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
 * 
 * @param {number} investmentId
 * @param {number} start_date
 * @param {number} amount
 * @param {number} investmentplans_id
 * @param {[Date]} planCatalog
 * @param {Date} serverDate
 * 
 * @returns { { investmentId:number, result:{daysUntilExpire:number, setToExpired:boolean, isAPayDay:boolean}} | {investmentId:number, error: string,traceData: { start_date:Date, amount:number, investmentplans_id:number, serverDate:Date }}  } A object with information about the process's result
 */
const insertInterestProcess = (investmentId, start_date, amount, investmentplans_id, planCatalog, serverDate) => {
    return new Promise(async (resolve, reject) => {

        let result = {}
        try {

            const plan = planCatalog.find(item => item.id === investmentplans_id)

            if (!plan) {
                throw new Error("Error al obtener el plan")
            }

            const payDays = generatePayDays(start_date, plan.months)

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
                traceData: { start_date, amount, investmentplans_id, serverDate }
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
