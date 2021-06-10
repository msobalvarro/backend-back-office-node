const sql = require('../../configuration/sql.config')

/**
 * Get AlyTrade investments related to a user
 * @param {Number} userId
 * @returns { Promise<[{
 * enabled:number,
 * investment_id:number,
 * id_currency:number,
 * id_user:number,
 * start_date: Date,
 * amount:number,
 * expired:number}]> } 
 */
const getAlytradeInvestmentsByUserId = (userId) => {
    return new Promise(async (resolve, reject) => {

        if (!userId) {
            reject("userId is not defined")
            return
        }

        const query = `select
        i.enabled,
        i.id investment_id,
        i.id_currency,
        i.id_user,
        i.start_date,
        i.amount,
        aip.expired
    from investment i 
        inner join alytrade_investment_plan aip on aip.investment_id  = i.id 
    where i.id_user = ?`
        try {
            const result = await sql.run(query, userId)
            resolve(result)
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * Get Interest from a investment
 * @param {Number} investmentId 
 * @returns {Promise<[{id_currency:number, amount:number, date:date}]>}
 */
const getAlytradeInvestmentInterestByInvestment = (investmentId) => {
    return new Promise(async (resolve, reject) => {

        if (!investmentId) {
            reject("investmentId is not defined")
            return
        }

        const query = `select
                i.id_currency, aii.amount, aii.date
            from alytrade_investment_interest aii 
            inner join investment i on aii.investment_id  = i.id 
            where aii.investment_id = ? order by aii.date asc`

        try {
            const result = await sql.run(query, investmentId)
            resolve(result)
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * Verify if user already have an investment in that currency
 * @param {Number} userId 
 * @param {Number} currencyId 
 * @returns {boolean} True if user have an investment in that currency else False
 */
const isAlreadyExistsInvestmentByUser = async (userId, currencyId) => {
    const userInvestments = await getAlytradeInvestmentsByUserId(userId)
    const result = userInvestments.find(item => item.id_currency === currencyId)

    return result ? true : false
}

/**
 * Create a new investmentRow
 * @param {{id_currency:number, id_user:number, start_date:date, hash:string, amount:number, email_airtm:string, aproximate_amount:number, approved:number, enabled:number, alypay:number}}
 */

const insertNewInvestment = async ({
    id_currency, id_user, start_date, hash, amount, email_airtm, aproximate_amount, approved, enabled, alypay
}) => {
    const query = `INSERT INTO investment
    (id_currency, id_user, start_date, hash, amount, email_airtm, aproximate_amount, approved, enabled, alypay)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `
    return new Promise(async (resolve, reject) => {
        try {
            const result = await sql.run(query, [
                id_currency, id_user, start_date, hash, amount, email_airtm, aproximate_amount, approved, enabled, alypay
            ])
            resolve(result)
        } catch (err) {
            reject(err)
        }
    })
}
/**
 * insert a new Investment Plan related to an Investment
 * @param {{investment_id:number, investmentplans_id:number, expired:numbre}} 
 */
const insertNewInvestmentPlan = ({
    investment_id, investmentplans_id, expired
}, qm) => {
    const query = `INSERT INTO alytrade_investment_plan
    (investment_id, investmentplans_id, expired)
    VALUES(0, 0, 0);
    `
    return new Promise(async (resolve, reject) => {
        try {
            const result = await sql.run(query, [investment_id, investmentplans_id, expired])
            resolve(result)
        } catch (err) {
            reject(err)
        }
    })
}


module.exports = {
    getAlytradeInvestmentsByUserId,
    getAlytradeInvestmentInterestByInvestment,
    isAlreadyExistsInvestmentByUser
}
