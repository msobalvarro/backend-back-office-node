const Express = require('express')
const router = Express.Router()
const userManagement = require('./userManage.controller')
const customer = require('./customer.controller')
const { auth } = require('../middleware/auth.middleware')
const { insertOHLCRows, getCoinMarketCapOHLCHistorical } = require('./cronjob/updateHistoryPriceMethods')
const moment = require('moment')
router.use('/', userManagement)
router.use('/', auth, customer)
router.post('/cmc', (req, res) => {
    
    getCoinMarketCapOHLCHistorical({
        time_start: moment().subtract(7, 'days').format('YYYY-MM-DD'),
        time_end: moment().format('YYYY-MM-DD'),
    },false).then(response => {
        console.log("obtencion OK")
        insertOHLCRows(response).then(r=>{
            console.log("insercion OK")
            console.log(r)
            res.send(response)
        }).catch(err=> {
            console.log("error en insert",err)
            res.send("Error en insert")
        })
    }).catch(err => {
        console.log("error en get",err)
        res.send("Error en obtencion")
    })
})

module.exports = router