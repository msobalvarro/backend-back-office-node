const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')

class InformationUserModel extends Model { }

InformationUserModel.init({
    id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstname: {
        type: type.STRING,
    },
    lastname: {
        type: type.STRING,
    },
    email: {
        type: type.STRING,
    },
    phone: {
        type: type.STRING,
    },
    country: {
        type: type.STRING,
    },
    more_info: {
        type: type.STRING,
    }
}, { sequelize, modelName: 'information_user' })

module.exports = InformationUserModel