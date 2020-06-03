const express = require('express')
const router = express.Router()
const rp = require("request-promise")
const moment = require('moment')
const WriteError = require('../../logs/write')
const { WALLETS } = require("../../middleware/hash")

const options = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    qs: {
        'symbol': 'BTC,ETH,DASH,LTC'
    },
    headers: {
        'X-CMC_PRO_API_KEY': 'f78fa793-b95e-4a58-a0ef-760f070defb0'
    },
    json: true,
    gzip: true
}

router.get('/', async (req, res) => {
    try {
        const getPrice = async () => {
            await rp(options).then(({ data }) => {
                const _data = {
                    BTC: {
                        ...data.BTC,
                        comission: 0.0005,
                        wallet: WALLETS.BTC,
                    },
                    ETH: {
                        ...data.ETH,
                        comission: 0.0045,
                        wallet: WALLETS.ETH,
                    },
                    DASH: {
                        ...data.DASH,
                        comission: 0.003,
                        wallet: WALLETS.DASH,
                    },
                    LTC: {
                        ...data.LTC,
                        comission: 0.0015,
                        wallet: WALLETS.LTC,
                    },
                }

                // Alamacenamos lo retornado de la api
                req.session.minPrices = _data

                // Alamacenamos la ultima actualizacion
                req.session.minPriceLastUpdate = moment()
            }).catch((err) => {
                throw err.toString()
            })
        }

        // Verificamos si es primera vez que se ejecuta
        if (req.session.minPriceLastUpdate === "null") {
            await getPrice()
        }

        // Obtenemos la diferencia de tiempo (cuanto ha pasado)
        const diferenceTime = moment.duration(moment(req.session.minPriceLastUpdate).diff(moment()))

        // Si ya han pasado 30 segundo.. actualizar precios
        if (diferenceTime.get("seconds") < -30) {
            await getPrice()
        }

        res.send(req.session.minPrices)
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