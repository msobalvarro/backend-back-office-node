const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')

class AlytradeInvestmentPlansCatalog extends Model { }

AlytradeInvestmentPlansCatalog.init({
    id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    description: {
        type: type.STRING
    },
    percentage: {
        type: type.FLOAT
    },
    months: {
        type: type.INTEGER
    },
    currency_id: {
        type: type.INTEGER
    }
}, {
    sequelize, modelName: 'alytrade_investmentplans_catalog'
})

module.exports = AlytradeInvestmentPlansCatalog
