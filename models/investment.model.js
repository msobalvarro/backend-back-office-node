
const { DataTypes: type, Model } = require('sequelize')
const AlytradeInvestmentPlansModel = require('./alytradeInvestmentPlans.model')
const { sequelize } = require('../configuration/sql.config')
const AlytradeInvestmentInterestModel = require('./alytradeInvestmentInterest.model')

class InvestmentModel extends Model { }

InvestmentModel.init({
    id:{
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_currency: {
        type: type.INTEGER
    },
    id_user:{
        type: type.INTEGER
    },
    start_date:{
        type: type.DATE,
        defaultValue: type.NOW()
    },
    hash:{
        type: type.STRING
    },
    amount:{
        type: type.DOUBLE
    },
    email_airtm:{
        type: type.STRING
    },
    aproximate_amount:{
        type: type.DOUBLE
    },
    approved:{
        type:type.INTEGER
    },
    enabled:{
        type: type.INTEGER
    },
    alypay:{
        type: type.INTEGER
    }
},{
    sequelize,modelName:'investment'
})

InvestmentModel.hasOne(AlytradeInvestmentPlansModel,{
     sourceKey: 'id', foreignKey:'investment_id', as:'plan'
})

InvestmentModel.hasMany(AlytradeInvestmentInterestModel,{
    sourceKey: 'id', foreignKey: 'investment_id',as:'interests'
})

module.exports = InvestmentModel