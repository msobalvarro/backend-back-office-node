const { sequelize } = require('../../../configuration/sql.config')
const { QueryTypes, Op, literal } = require('sequelize')
const WriteError = require('../../../logs/write.config')
const Models = require('../../../models')

const queries = {
    LAST_USERS: 'select * from vw_alytrade_last_users'
}
const logError = (message) => {
    WriteError('AlyTrade|Users.service.js', message)
}
const getLastUser = async () => {
    try {
        const lastUsers = await sequelize.query(queries.LAST_USERS, {
            type: QueryTypes.SELECT,
        })
        return lastUsers
    } catch (err) {
        console.log(err)
        logError('Error al obtener los ultimos usuarios')
    }
    return null
}

const findUsers = async ({ page, username, pageSize } = {}) => {
    try {
        page = page === undefined ? 0 : page
        pageSize = pageSize === undefined ? 50 : pageSize
        const offset = Number(page) * Number(pageSize)
        const where = username ? { 'username': { [Op.like]: `%${username}%` } } : undefined

        console.log({ pageSize, offset, where })

        const count = await Models.UsersModel.count({
            include: [{
                model: Models.AlytradeInformationModel,
                required: true,
            }],
        })

        //literal(`LIMIT ${pageSize} OFFSET ${offset}`)
        const users = await Models.UsersModel.findAll({
            //subQuery: false,
            //raw:true,
            offset,
            limit: pageSize,
            //limit: literal(` ${pageSize} OFFSET ${offset}`),
            //offset: literal(` ${offset} LIMIT ${pageSize}`),
            where,
            attributes: ['id', 'username', 'kyc_type','id_information'],
            order: [['id', 'ASC']],
            include: [{
                attributes: ['id', 'user_id', 'alytrade_sponsor_user_id', 'sponsors_id'],
                model: Models.AlytradeInformationModel,
                required: true,
            }, {
                attributes: ['id_user', 'id_currency', 'start_date', 'hash', 'amount', 'aproximate_amount', 'approved', 'enabled', 'alypay'],
                model: Models.InvestmentModel,
                include: [{
                    attributes: ['investment_id', 'expired', 'percentage', 'months', 'wallet',],
                    model: Models.AlytradeInvestmentPlansModel,
                    as: 'plan',
                }, {
                    attributes: ['investment_id', 'amount', 'approved', 'date'],
                    model: Models.AlytradeInvestmentInterestModel,
                    as: 'interests',
                }]
            },
            {
                attributes: ['id', 'firstname', 'lastname', 'email', 'phone', 'country'],
                model: Models.InformationUserModel,
            }]
        })

        console.log({
            limit: offset,
            offset: pageSize,
            where,
            users
        })

        return {
            page,
            count: count,
            data: users, //.rows,
            totalPages: Math.ceil(count / pageSize),
            pageSize,
            other: { where }
        }
    } catch (err) {
        console.log(err)
        logError(' findUsers | Error al encontrar usuarios')
    }
}

module.exports = {
    getLastUser,
    findUsers
}