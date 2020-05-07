const express = require('express')
const router = express.Router()
const rp = require("request-promise")
const moment = require('moment')
const WriteError = require('../../logs/write')

const options = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    qs: {
        'symbol': 'BTC,ETH,DASH,LTC,XRP,USDT,BCH,EOS,BNB,NEO,ZEC'
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
                        wallet: "1LN1cLYC5Qu4Phd1vZnMahtRQGLndvwBUn",
                    },
                    ETH: {
                        ...data.ETH,
                        comission: 0.0045,
                        wallet: "0xecb480b4c2eb89b71dfadbbb61511641ab7bfa8f",
                    },
                    DASH: {
                        ...data.DASH,
                        comission: 0.003,
                        wallet: "XnfAkHxvjSVKARHhcBooWK97m95ATj7B3Y",
                    },
                    LTC: {
                        ...data.LTC,
                        comission: 0.0015,
                        wallet: "LLPhWvd9ZfDSDdZFVRfN6XJnLJUxdVqdqX",
                    },
                    XRP: {
                        ...data.XRP,
                        comission: 0.375,
                        wallet: "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh",
                        label: "107720653",
                    },
                    USDT: {
                        ...data.USDT,
                        comission: 1.47,
                        wallet: "0xecb480b4c2eb89b71dfadbbb61511641ab7bfa8f",
                    },
                    BCH: {
                        ...data.BCH,
                        comission: 0.0015,
                        wallet: "1LN1cLYC5Qu4Phd1vZnMahtRQGLndvwBUn",
                    },
                    EOS: {
                        ...data.EOS,
                        comission: 0.15,
                        wallet: "binancecleos",
                        memo: "104191240"
                    },
                    BNB: {
                        ...data.BNB,
                        comission: 0.0015,
                        wallet: "bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23",
                        memo: "108299663"
                    },
                    NEO: {
                        ...data.NEO,
                        comission: 0.75,
                        wallet: "AGnG3CgMh4Kv343GSKKMhnhd6XjZSrLFfp",
                    },
                    ZEC: {
                        ...data.ZEC,
                        comission: 0.0075,
                        wallet: "t1cGuspZg3Kb3Q9kGzPy8ZdcaNQQgMiXzzg",
                    },
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

module.exports = router