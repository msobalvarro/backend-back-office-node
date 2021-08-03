const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')

class AlytradeInvestmentInterestModel extends Model { }

AlytradeInvestmentInterestModel.init({
    id:{
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    investment_id:{
        type: type.INTEGER, 
    },
    amount:{
        type: type.DOUBLE, 
    },
    approved:{
        type: type.INTEGER, 
    },
    date:{
        type: type.DATEONLY,
    }
},{
    sequelize, modelName: 'alytrade_investment_interest'
})

module.exports =AlytradeInvestmentInterestModel 