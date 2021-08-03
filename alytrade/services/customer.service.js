const { sequelize } = require('../../configuration/sql.config')
const { UsersModel, AlytradeInformation, InvestmentModel } = require('../../models')

const getUserInvestments = async (userId) => {
    const users = await UsersModel.findAll({
        include: [{
            model: AlytradeInformation,
            required: true
        }, {
            model: InvestmentModel,
            required: true
        }]
    })

    return users
}

module.exports = {
    getUserInvestments
}