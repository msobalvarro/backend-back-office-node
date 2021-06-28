const { sequelize } = require('../../configuration/sql.config')
//const { InformationUserModel, UsersModel, InvestmentModel, AlytradeInvestmentPlansCatalog, AlytradeInvestmentPlansModel } = require('../../models')
const models = require('../../models')
const Crypto = require('crypto-js')
const { JWTSECRET } = process.env


/**
 * Create a Sponsor row in Sponsor table, useful when the new user has been refered by another one
 * @param {{ userId:number,userAlytradeInformation:object, sponsor_username:string, currencyId:number, amount:number, months:number, transaction:Transaction }} param0 
 * @returns Sponsor Row
 */
const createSponsorRow = async ({ userId, userAlytradeInformation, sponsor_username, currencyId, amount, months, transaction }) => {

    /**
     * 1. Obtiene el catalogo de comisiones
     * 2. Obtiene los datos del sponsor
     * 3. Crea el row en tabla sponsors
     * 4. Actualiza el registro del usuario referido en alytrade_information
     */
    const commissionCatalog = (await models.AlyTradeSponsorCommissionCatalogModel.findAll()).map(item => item.toJSON())
    let commission
    if (months > 12)
        commission = commissionCatalog.find(item => item.months = -1)
    else
        commission = commissionCatalog.find(item => item.months === months)

    if (!commission) {
        throw "Error getting Commission"
    }

    const sponsorData = await models.UsersModel.findOne({
        include: models.InformationUserModel,
        attributes: ['id', 'id_information'],
        where: { username: sponsor_username }
    })

    if (!sponsorData)
        throw 'Sponsor is not registered in AlyTrade'

    const sponsorRow = await models.SponsorsModel.create({
        id_referred: userId,
        id_information_user: sponsorData.information_user.id,
        id_currency: currencyId,
        amount: amount * commission.percentage,
        //registration_date: ,
        approved: 0,
    }, { transaction })

    userAlytradeInformation.alytrade_sponsor_user_id = sponsorData.id
    userAlytradeInformation.sponsors_id = sponsorRow.id
    await userAlytradeInformation.save({ transaction })

    return sponsorRow
}

/**
 * Create a new User and an Alytrade Account 
 * @param { {firstname:string, lastname:string, email:string, phone:string, country:string, more_info:string,username:string, 
 * password:string,id_currency:integer, hash:string, amount:float, months:integer, wallet:string, sponsor_username:string}} UserData User Data to create a new user and a alytrade Account
 * @returns {{informationUser, user, investment, investmentPlan}} Returs Sequelize models for InformationUser, User, Investment and InvestmentPlan
 */
const createNewAlytradeAccount = async ({
    firstname, lastname, email, phone, country, more_info,
    username, password,
    id_currency, hash, amount, months, wallet, sponsor_username
}) => {
    /**
     * 1. Information User
     * 2. User
     * 2.5. AlytradeInformation
     * 3. Investment
     * 4. Investment Plan
     */
    const t = await sequelize.transaction()
    try {

        const planes = await models.AlytradeInvestmentPlansCatalogModel.findAll()

        const userVerify = await models.UsersModel.findOne({
            where: { username }
        })

        if (userVerify)
            throw `User ${username} already exists`

        const informationUser = await models.InformationUserModel.create({
            firstname,
            lastname,
            email,
            phone,
            country,
            more_info
        }, { transaction: t })
        const user = await models.UsersModel.create({
            id_information: informationUser.id,
            username,
            password: Crypto.SHA256(password, JWTSECRET).toString(),
            enabled: 0,
        }, { transaction: t })

        const [newUserAlytradeInformation, created] = await models.AlytradeInformationModel.findOrCreate({
            where: { user_id: user.id },
            defaults: {
                user_id: user.id
            },
            transaction: t
        })

        if (sponsor_username) {
            await createSponsorRow({
                amount,
                currencyId: id_currency,
                months,
                sponsor_username,
                transaction: t,
                userId: user.id,
                userAlytradeInformation: newUserAlytradeInformation
            })
        }

        const investment = await models.InvestmentModel.create({
            id_currency,
            id_user: user.id,
            // start_date: DataTypes.NOW(), // la hora se pone por default en base a la del servidor
            hash,
            amount,
            approved: 0,
            enabled: 1,
            alypay: 0
        }, { transaction: t })

        let plan = undefined
        if (months > 12)
            plan = planes.find(item => { return (item.currency_id === id_currency && item.months === -1) })
        else
            plan = planes.find(item => { return (item.currency_id === id_currency && item.months === months) })

        if (!plan)
            throw 'Plan not found'

        const investmentPlan = await models.AlytradeInvestmentPlansModel.create({
            investment_id: investment.id,
            investmentplans_id: plan.id,
            expired: 0,
            months: months,
            wallet
        }, { transaction: t })

        await t.commit()

        return {
            informationUser, user, investment, investmentPlan
        }
    } catch (err) {
        console.log(err)
        await t.rollback()
        throw err
    }

}
/**
 * Create the Alytrade account only (investment,alytradeinvestmentplan)
 * @param {{id_currency:integer, hash:string, amount:double, months:integer, userId:integer}} InvesmentPlanData 
 * @returns {{investment, investmentPlan}} Returns Sequelize Models for investment and InvestmentPlan
 */
const createAlytradeAccount = async ({
    id_currency, hash, amount, months,
    userId
}) => {
    const t = await sequelize.transaction()
    try {

        const [model, created] = await AlytradeInformation.findOrCreate({
            where: { user_id: userId },
            defaults: {
                user_id: userId
            },
            transaction: t
        })

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