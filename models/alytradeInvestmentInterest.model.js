const { DataTypes: type, Model } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')

class AlytradeInvestmentInterest extends Model { }

AlytradeInvestmentInterest.init({
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
        type: type.DATE,
    }
},{
    sequelize, modelName: 'alytrade_investment_interestf'
})

module.exports =AlytradeInvestmentInterest 