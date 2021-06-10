const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')

class AlytradeInformation extends Model { }

AlytradeInformation.init({
    id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: type.INTEGER,
    }
}, { sequelize, modelName: 'alytrade_information' })

module.exports = AlytradeInformation
