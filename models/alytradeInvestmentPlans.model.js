const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')

class AlyTradeInvestmentPlansModel extends Model { }

AlyTradeInvestmentPlansModel.init({
    id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    investment_id: {
        type: type.INTEGER,
        allowNull: false
    },
    investmentplans_id: {
        type: type.INTEGER,
        allowNull: false
    },
    expired: {
        type: type.INTEGER,
        allowNull: false
    },
    months: {
        type: type.INTEGER,
        allowNull: false
    }
}, {
    sequelize, modelName: 'alytrade_investment_plan'
})

module.exports = AlyTradeInvestmentPlansModel