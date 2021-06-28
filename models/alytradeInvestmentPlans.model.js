const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')
const AlytradeInvestmentInterestModel = require('./alytradeInvestmentInterest.model')
const AlytradeInvestmentPlansCatalogModel = require('./alytradeInvestmentPlansCatalog.model')

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
    },
    wallet: {
        type: type.STRING,
        allowNull: false
    }
}, {
    sequelize, modelName: 'alytrade_investment_plan'
})

AlyTradeInvestmentPlansModel.hasOne(AlytradeInvestmentPlansCatalogModel, {
    sourceKey: 'investmentplans_id', foreignKey: 'id', as: 'planData'
})


module.exports = AlyTradeInvestmentPlansModel