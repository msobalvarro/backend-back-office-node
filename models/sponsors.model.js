const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')

class SponsorsModel extends Model { }

SponsorsModel.init({
    id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_referred: {
        type: type.INTEGER,
        allowNull: false,
    },
    id_information_user: {
        type: type.INTEGER,
        allowNull: false,
    },
    id_currency: {
        type: type.INTEGER,
        allowNull: false,
    },
    amount: {
        type: type.INTEGER,
        allowNull: false,
    },
    registration_date: {
        type: type.DATE,
        defaultValue: type.NOW
    },
    approved: {
        type: type.INTEGER,
        allowNull: false,
    }
}, { sequelize, modelName: 'sponsors' })

module.exports = SponsorsModel