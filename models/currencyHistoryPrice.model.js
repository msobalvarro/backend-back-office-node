const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')

class CurrencyHistoryPriceModel extends Model { }

CurrencyHistoryPriceModel.init({
    id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    currency_id: {
        type: type.INTEGER,
        allowNull: false
    },
    high_price: {
        type: type.FLOAT,
        allowNull: false
    },
    low_price: {
        type: type.FLOAT,
        allowNull: false
    },
    open_price: {
        type: type.FLOAT,
        allowNull: false
    },
    close_price: {
        type: type.FLOAT,
        allowNull: false
    },
    time_high: {
        type: type.DATE,
        allowNull: false
    },
    time_low: {
        type: type.DATE,
        allowNull: false
    },
    time_open: {
        type: type.DATE,
        allowNull: false
    },
    time_close: {
        type: type.DATE,
        allowNull: false
    },

}, {
    sequelize, modelName: 'currency_history_price'
})

module.exports = CurrencyHistoryPriceModel