const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')

class AlyTradeSponsorCommissionCatalogModel extends Model { }
AlyTradeSponsorCommissionCatalogModel.init({
    id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    months: {
        type: type.INTEGER,
        allowNull: false
    },
    description: {
        type: type.STRING,
        allowNull: false
    },
    percentage: {
        type: type.FLOAT,
        allowNull: false
    }
}, { sequelize, modelName: "alytrade_sponsor_commission_catalog" })

module.exports = AlyTradeSponsorCommissionCatalogModel