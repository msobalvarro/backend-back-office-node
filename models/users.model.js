const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')

class UsersModel extends Model { }
UsersModel.init({
    id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_information: {
        type: type.INTEGER
    },
    id_sponsor: {
        type: type.INTEGER
    },
    username: {
        type: type.STRING,
        allowNull: false,
    },
    password: {
        type: type.STRING,
        allowNull: false,
    },
    enabled: {
        type: type.INTEGER
    },
    wallet_btc: {
        type: type.STRING
    },
    wallet_eth: {
        type: type.STRING
    },
    user_coinbase: {
        type: type.STRING,
    },
    kyc_type: {
        type: type.INTEGER
    },
    reviewed: {
        type: type.INTEGER
    }
}, {
    sequelize,
    modelName: "users"
})

module.exports = UsersModel
