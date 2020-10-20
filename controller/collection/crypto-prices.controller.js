const express = require('express')
const router = express.Router()


// import middlewares
const { WALLETS } = require('../../middleware/hash.middleware')

// import constants and functionss
const rp = require("request-promise")
const moment = require('moment')
const log = require('../../logs/write.config')
const { ALY, COMISSIONS, NOW } = require("../../configuration/constant.config")
const { COINMARKETCAP_API } = require("../../configuration/vars.config")

/**
 * connfiguraciones para ejecucion de peticiones de la coinmaerketcap
 */
const options = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    qs: {
        'symbol': 'BTC,ETH,DASH,LTC,XRP,USDT,BCH,EOS,BNB,NEO,ZEC,BTCV'
    },
    headers: {
        'X-CMC_PRO_API_KEY': COINMARKETCAP_API
    },
    json: true,
    gzip: true
}

/**
 * Constante que alamcena el tiempo de diferencia (1 min)
 */
const timeDiference = -1

router.get('/', async (req, res) => {
    try {
        const getPrice = async () => {

            console.log("Obteniendo precios")

            const { data } = await rp(options)

            // construimos los datos de cada moneda
            const allData = {
                ALY,
                BTC: {
                    ...data.BTC,
                    comission: COMISSIONS.BTC,
                    wallet: WALLETS.BTC,
                },
                ETH: {
                    ...data.ETH,
                    comission: COMISSIONS.ETH,
                    wallet: WALLETS.ETH,
                },
                DASH: {
                    ...data.DASH,
                    comission: COMISSIONS.DASH,
                    wallet: WALLETS.DASH,
                },
                LTC: {
                    ...data.LTC,
                    comission: COMISSIONS.LTC,
                    wallet: WALLETS.LTC,
                },
                XRP: {
                    ...data.XRP,
                    minimun: 30,
                    comission: COMISSIONS.XRP,
                    wallet: WALLETS.XRP,
                    label: "107720653",
                },
                USDT: {
                    ...data.USDT,
                    minimun: 15,
                    comission: COMISSIONS.USDT,
                    wallet: WALLETS.USDT,
                },
                BCH: {
                    ...data.BCH,
                    comission: COMISSIONS.BCH,
                    wallet: WALLETS.BCH,
                },
                EOS: {
                    ...data.EOS,
                    minimun: 5,
                    comission: COMISSIONS.EOS,
                    wallet: WALLETS.EOS,
                    memo: "104191240"
                },
                BNB: {
                    ...data.BNB,
                    minimun: 1,
                    comission: COMISSIONS.BNB,
                    wallet: WALLETS.BNB,
                    memo: "108299663"
                },
                NEO: {
                    ...data.NEO,
                    minimun: 2,
                    comission: COMISSIONS.NEO,
                    wallet: WALLETS.NEO,
                },
                ZEC: {
                    ...data.ZEC,
                    comission: COMISSIONS.ZEC,
                    wallet: WALLETS.ZEC,
                },
                BTCV: {
                    ...data.BTCV,
                    comission: COMISSIONS.BTCV,
                    wallet: WALLETS.BTCV
                }
            }

            // construimos los datos que guardaremos con un formato JSON
            const coinmarketcap = {
                data: allData,
                update: NOW()
            }

            // Alamacenamos lo retornado de la api
            req.session.coinmarketcap = coinmarketcap
        }

        // Verificamos si es primera vez que se ejecuta
        if (req.session.coinmarketcap === undefined) {
            await getPrice()
        } else {
            // Obtenemos la diferencia de tiempo (cuanto ha pasado)
            const diferenceTime = moment(req.session.coinmarketcap.update).diff(NOW(), "minutes")

            // Si ya han pasado 1 minuto.. actualizar precios
            if (diferenceTime < timeDiference) {
                await getPrice()
            }
        }

        res.send(req.session.coinmarketcap.data)
    } catch (message) {
        /**Error information */
        log(`crypto-prices.controller.js | ${message}`)

        res.send({ error: true, message })
    }
})

router.get('/minimal', async (req, res) => {
    try {
        req.uest({ method: 'GET', url: '/collection/prices' }, (er, _, body) => {
            if (er) {
                console.log(er)
                throw String("No hemos podido procesar los precios, intente mas tarde")
            }

            const { ALY, BTC, ETH, DASH, LTC, BTCV } = body

            res.send({ ALY, BTC, ETH, DASH, LTC, BTCV })
        })
    } catch (error) {
        /**Error information */
        log(`crypto-prices.js | min prices | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

module.exports = router