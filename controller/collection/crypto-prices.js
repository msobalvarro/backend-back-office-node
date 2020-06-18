const express = require('express')
const router = express.Router()
const rp = require("request-promise")
const moment = require('moment')
const WriteError = require('../../logs/write')

const { WALLETS } = require('../../middleware/hash')

const { ALY, COMISSIONS } = require("../../config/constant")

const options = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    qs: {
        'symbol': 'BTC,ETH,DASH,LTC,XRP,USDT,BCH,EOS,BNB,NEO,ZEC,BTCV'
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
                    ALY,
                    BTC: {
                        ...data.BTC,
                        comission: COMISSIONS.BTC,
                        wallet: WALLETS.BTC,
                        // wallet: "1LN1cLYC5Qu4Phd1vZnMahtRQGLndvwBUn",
                    },
                    ETH: {
                        ...data.ETH,
                        comission: COMISSIONS.ETH,
                        wallet: WALLETS.ETH,
                        // wallet: "0xecb480b4c2eb89b71dfadbbb61511641ab7bfa8f",
                    },
                    DASH: {
                        ...data.DASH,
                        comission: COMISSIONS.DASH,
                        wallet: WALLETS.DASH,
                        // wallet: "XnfAkHxvjSVKARHhcBooWK97m95ATj7B3Y",
                    },
                    LTC: {
                        ...data.LTC,
                        comission: COMISSIONS.LTC,
                        wallet: WALLETS.LTC,
                        // wallet: "LLPhWvd9ZfDSDdZFVRfN6XJnLJUxdVqdqX",
                    },                    
                    XRP: {
                        ...data.XRP,
                        minimun: 30,
                        comission: COMISSIONS.XRP,
                        wallet: WALLETS.XRP,
                        // wallet: "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh",
                        label: "107720653",
                    },
                    USDT: {
                        ...data.USDT,
                        minimun: 15,
                        comission: COMISSIONS.USDT,
                        // wallet: "0xecb480b4c2eb89b71dfadbbb61511641ab7bfa8f",
                        wallet: WALLETS.USDT,
                    },
                    BCH: {
                        ...data.BCH,
                        comission: COMISSIONS.BCH,
                        // wallet: "1LN1cLYC5Qu4Phd1vZnMahtRQGLndvwBUn",
                        wallet: WALLETS.BCH,
                    },
                    EOS: {
                        ...data.EOS,
                        minimun: 5,
                        comission: COMISSIONS.EOS,
                        // wallet: "binancecleos",
                        wallet: WALLETS.EOS,
                        memo: "104191240"
                    },
                    BNB: {
                        ...data.BNB,
                        minimun: 1,
                        comission: COMISSIONS.BNB,
                        wallet: WALLETS.BNB,
                        // wallet: "bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23",
                        memo: "108299663"
                    },
                    NEO: {
                        ...data.NEO,
                        minimun: 2,
                        comission: COMISSIONS.NEO,
                        wallet: WALLETS.NEO,
                        // wallet: "AGnG3CgMh4Kv343GSKKMhnhd6XjZSrLFfp",
                    },
                    ZEC: {
                        ...data.ZEC,
                        comission: COMISSIONS.ZEC,
                        wallet: WALLETS.ZEC,
                        // wallet: "t1cGuspZg3Kb3Q9kGzPy8ZdcaNQQgMiXzzg",
                    },
                    BTCV: {
                        ...data.BTCV,
                        comission: COMISSIONS.BTCV,
                        wallet: WALLETS.BTCV
                    }
                }

                // Alamacenamos lo retornado de la api
                req.session.prices = _data

                // Alamacenamos la ultima actualizacion
                req.session.priceLastUpdate = moment()
            }).catch((err) => {
                throw err.toString()
            })
        }

        // Verificamos si es primera vez que se ejecuta
        if (req.session.priceLastUpdate === "null") {
            await getPrice()
        }

        // Obtenemos la diferencia de tiempo (cuanto ha pasado)
        const diferenceTime = moment.duration(moment(req.session.priceLastUpdate).diff(moment()))

        // Si ya han pasado 30 segundo.. actualizar precios
        if (diferenceTime.get("seconds") < -30) {
            await getPrice()
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

router.get('/min', async (req, res) => {
    try {
        const getPrice = async () => {
            await rp(options).then(({ data }) => {
                const _data = {
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
                    BTCV: {
                        ...data.BTCV,
                        comission: COMISSIONS.BTCV,
                        wallet: WALLETS.BTCV
                    },
                    ALY,
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