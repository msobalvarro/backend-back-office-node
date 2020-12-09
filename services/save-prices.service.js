const store = require("../configuration/store/index.store")
const moment = require("moment")

// import mysql configuration
const sql = require("../configuration/sql.config")
const { insertPriceCoinDiary } = require("../configuration/queries.sql")

/**variable que guarda el contador */
let counterTime = null

/**Constante que define el tiempo de ejecucion */
const time = 40 * 1000


/**Metodo que enciende el autoguardado */
const on = () => {
    counterTime = setInterval(async () => {
        const { prices } = store.getState()

        // Hora del momento
        const hour = moment().get("hours")
        
        // console.log(hour)

        // verifcamos la hora sea a las 12 AM
        if (hour === 0) {

            // verificamos si hay datos en el store de redux
            if (Object.keys(prices).length > 0) {
                const { BTC, ETH } = prices.data

                // construimos los parametros
                const paramsSQL = [prices.update, ETH.quote.USD.price, BTC.quote.USD.price]

                // insertamos los datos
                await sql.run(insertPriceCoinDiary, paramsSQL)
                // console.log(paramsSQL)
            }
        }

        // console.log(store.getState())
    }, time)
}

/**Metodo que apaga el servicio de guardado */
const off = () => clearInterval(counterTime)

module.exports = { on, off }