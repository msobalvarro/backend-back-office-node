const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')
const AlytradeInformation = require('./alytradeInformation.model')
const InformationUserModel = require('./informationUser.model')
const InvestmentModel = require('./investment.model')

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

UsersModel.hasOne(InformationUserModel,{
    sourceKey:'id_information', foreignKey: 'id'
})

UsersModel.hasOne(AlytradeInformation,{
    sourceKey: 'id', foreignKey:'user_id'
})

UsersModel.hasMany(InvestmentModel,{
    sourceKey: 'id', foreignKey:'id_user'
})
module.exports = UsersModel
