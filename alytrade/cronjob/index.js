const {
    getCatalog,
    getUnexpiredInvestents,
    getServerDate,
    insertInterestProcess
} = require("./methods")
const { insertOHLCRows, getCoinMarketCapOHLCHistorical } = require('./updateHistoryPriceMethods')
const moment = require('moment')

/**
 * Run the process to verify investments and insert the interest if is a payday
 * @returns {Promise<void>}
 */
const interestGenerationProcess = async () => {
    const investments = await getUnexpiredInvestents()
    const fecha = await getServerDate()

    if (!Array.isArray(investments)) {
        console.log("No hay investments para realizar proceso de calculo")
        return
    }

    const operaciones = investments.map(invest => {
        return () => insertInterestProcess(invest.investmentId, invest.start_date, invest.amount, invest.months, fecha)
    })

    console.log("Numero de operaciones", operaciones.length)
    Promise.all(
        operaciones.map(promise => promise().catch(err => { return err }))
    ).then(result => {
        console.log(JSON.stringify(result, null, 4))
    })
}

/**
 * Run the process to update coin history
 */
const updateCoinHistoryPrice = () =>{
    getCoinMarketCapOHLCHistorical({
        time_start: moment().subtract(7, 'days').format('YYYY-MM-DD'),
        time_end: moment().format('YYYY-MM-DD'),
    },false).then(response => {
        console.log("obtencion OK")
        insertOHLCRows(response).then(r=>{
            console.log("insercion OK")
            console.log(r)
            //res.send(response)
        }).catch(err=> {
            console.log("error en insert",err)
            //res.send("Error en insert")
        })
    }).catch(err => {
        console.log("error en get",err)
        //res.send("Error en obtencion")
    })
}

module.exports = {
    interestGenerationProcess,
    updateCoinHistoryPrice
}