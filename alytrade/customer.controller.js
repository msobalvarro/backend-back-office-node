const Express = require('express')
const router = Express.Router()
const { Op } = require("sequelize")
const models = require('../models')
const moment = require('moment')

router.get('/dashboard/:userId', async (req, res) => {
    const userId = req.params.userId
    let result = null
    try {
        result = await models.InvestmentModel.findAll({
            where: {
                id_user: userId
            },
            attributes: ['start_date', 'hash', 'amount'],
            include: [
                {
                    as: 'plan',
                    model: models.AlytradeInvestmentPlansModel,
                    attributes: ['months', 'wallet'],
                    required: true,
                    include: [{
                        as: 'planData',
                        attributes: ['months', 'percentage'],
                        model: models.AlytradeInvestmentPlansCatalogModel,
                        required: true
                    }]
                },
                {
                    as: 'interests',
                    model: models.AlytradeInvestmentInterestModel,
                    attributes: ['amount', 'date']
                }
            ]
        })
    } catch (err) {
        console.log(err.message)
        result = { error: true, message: err.message }
    } finally {
        res.status(result.error ? 418 : 200).send(result)
    }

})

router.get('/graph/:currencyId', async (req, res) => {
    const currencyId = req.params.currencyId
    let result = null
    try {
        result = await models.CurrencyHistoryPriceModel.findAll({
            attributes:[['open_price','price'],['time_open','datetime']],
            where:{
                currency_id: currencyId,
                time_open:{
                    [Op.between]: [moment().utc().subtract(7,'d'), moment().utc()]
                }
                
            }
        })
    } catch (err) {
        console.log(err.message)
        result = { error: true, message: err.message }
    } finally {
        res.status(result.error ? 418 : 200).send(result)
    }
})

module.exports = router