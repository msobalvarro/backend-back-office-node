const express = require('express')
const router = express.Router()
const rp = require("request-promise")
const moment = require('moment')
const WriteError = require('../../logs/write')

const options = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    qs: {
        'symbol': 'BTC,ETH,XRP,USDT,BCH,LTC,EOS,BNB,DASH,NEO,ZEC'
    },

    headers: {
        'X-CMC_PRO_API_KEY': 'f78fa793-b95e-4a58-a0ef-760f070defb0'
    },
    json: true,
    gzip: true
}

const getPrices = (req) => new Promise((resolve, reject) => {
    try {

    } catch (error) {
        reject(error)
    }
})

/**Return investment plans by id */
router.get('/', async (req, res) => {
    try {
        // Verificamos si es primera vez que se ejecuta
        if (req.session.priceLastUpdate === "null") {
            console.log("update firts time")

            await rp(options).then(({ data }) => {
                // Alamacenamos lo retornado de la api
                req.session.prices = data

                // Alamacenamos la ultima actualizacion
                req.session.priceLastUpdate = moment()
            }).catch((err) => {
                throw err.toString()
            })
        }

        // Obtenemos la diferencia de tiempo (cuanto ha pasado)
        const diferenceTime = moment.duration(moment(req.session.priceLastUpdate).diff(moment()))

        console.log(diferenceTime.get("seconds"))


        if (diferenceTime.get("minutes") <  -30) {
            console.log("update data")
            
            await rp(options).then(({ data }) => {
                // Alamacenamos lo retornado de la api
                req.session.prices = data

                // Alamacenamos la ultima actualizacion
                req.session.priceLastUpdate = moment()
            }).catch((err) => {
                throw err.toString()
            })
        }

        res.send(req.session.prices)
    } catch (error) {
        /**Error information */
        WriteError(`crypto-prices.js - catch execute petition, get prices from coinmarketcap | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

module.exports = router