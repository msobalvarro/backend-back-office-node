const moment = require('moment');
const { QueryTypes } = require('sequelize');
const { getUnexpiredInvestents } = require('../alytrade/cronjob/methods');
const customerService = require('../alytrade/services/customer.service');
const { sequelize } = require('../configuration/sql.config');
const models = require('../models')
test('findAllAltradeUsers', async done => {
    /*const investment = await models.InvestmentModel.findAll({
        where: {
            id: '521'
        }, include: [
            {
                model: models.AlytradeInvestmentPlansModel,
                required: true,
                include: [{
                    model: models.AlytradeInvestmentInterestModel,
                    required: true
                }, {
                    model: models.AlytradeInvestmentPlansCatalogModel,
                    required: true
                }]
            }
        ]
        console.log(JSON.stringify(user.toJSON(), null, 2))
    })*/
    /**
     * SELECT count(*) as count FROM alytrade_investment_interest aii WHERE
            DATE_FORMAT(date,"%Y-%m-%d") = DATE_FORMAT(?,"%Y-%m-%d")
            and investment_id  = ?`

            select i.id as investmentId, i.start_date,i.amount,aip.investmentplans_id from investment i 
            inner join alytrade_investment_plan aip ON  i.id = aip.investment_id  and aip.expired  = 0

            `update alytrade_investment_plan aip 
                        set expired = 1
                        where aip.investment_id = ?
     */
    const data = await getUnexpiredInvestents()
    console.log(data)
    console.log("HORA UTC", moment().utc().toDate())
    const dateQuery = "select now() as fecha"
    const resultDate = await sequelize.query(dateQuery, { plain: true, type: QueryTypes.SELECT })
    console.log("HORA SERVER", resultDate)
    done()
}, 40000)