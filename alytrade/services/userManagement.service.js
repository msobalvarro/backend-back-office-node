const { sequelize } = require('../../../configuration/sql.config')
const { InformationUserModel, UsersModel, InvestmentModel, AlytradeInvestmentPlansCatalog, AlytradeInvestmentPlansModel } = require('../../../models')
const Crypto = require('crypto-js')
const { JWTSECRET } = process.env

const createNewAlytradeAccount = async ({
    firstname, lastname, email, phone, country, more_info,
    username, password,
    id_currency, hash, amount, months
}) => {
    /**
     * 1. Information User
     * 2. User
     * 3. Investment
     * 4. Investment Plan
     */
    const t = await sequelize.transaction()
    try {

        const planes = await AlytradeInvestmentPlansCatalog.findAll()

        const informationUser = await InformationUserModel.create({
            firstname,
            lastname,
            email,
            phone,
            country,
            more_info
        }, { transaction: t })
        const user = await UsersModel.create({
            id_information: informationUser.id,
            username,
            password: Crypto.SHA256(password, JWTSECRET).toString(),
            enabled: 0,
        }, { transaction: t })
        const investment = await InvestmentModel.create({
            id_currency,
            id_user: user.id,
            // start_date: DataTypes.NOW(), // la hora se pone por dafult en base a la del servidor
            hash,
            amount,
            approved: 1,
            enabled: 1,
            alypay: 0
        }, { transaction: t })

        const plan = planes.find(item => {
            return (item.currency_id === id_currency && item.months === months)
        })

        if (!plan)
            throw 'Plan no encontrado'

        const investmentPlan = await AlytradeInvestmentPlansModel.create({
            investment_id: investment.id,
            investmentplans_id: plan.id,
            expired: 0,
            months: months
        }, { transaction: t })

        await t.commit()

        return {
            informationUser, user, investment, investmentPlan
        }
    } catch (err) {
        console.log(err)

        await t.rollback()
    }

}

const createAlytradeAccount = async ({
    id_currency, hash, amount, months,
    userId
}) => {
    const t = await sequelize.transaction()
    try {
        const investment = await InvestmentModel.create({
            id_currency,
            id_user: userId,
            // start_date: DataTypes.NOW(), // la hora se pone por dafult en base a la del servidor
            hash,
            amount,
            approved: 1,
            enabled: 1,
            alypay: 0
        }, { transaction: t })

        const plan = planes.find(item => {
            return (item.currency_id === id_currency && item.months === months)
        })

        if (!plan)
            throw 'Plan no encontrado'

        const investmentPlan = await AlytradeInvestmentPlansModel.create({
            investment_id: investment.id,
            investmentplans_id: plan.id,
            expired: 0,
            months: months
        }, { transaction: t })

        await t.commit()

        return {
            investment, investmentPlan
        }
    }
    catch (err) {
        console.log(err)
        t.rollback()
    }
}

module.exports = {
    createNewAlytradeAccount,
    createAlytradeAccount
}