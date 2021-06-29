const axios = require('axios')
const fetch = require("node-fetch")
const _ = require("lodash")
const log = require("../logs/write.config")
const success = {
    success: true
}
const getCMCOhlcvHistorical = ({ time_start, time_end }, sandbox = true) => {
    return new Promise((resolve, reject) => {

        const enviroment = {
            sandboxHost: 'https://sandbox-api.coinmarketcap.com',
            proHost: 'https://pro-api.coinmarketcap.com',
            sandboxKey: '54bcf4d-1bca-4e8e-9a24-22ff2c3d462c',
            proKey: '630ebedd-2861-4cd5-8efc-c853368c2841'
        }

        const host = sandbox ? enviroment.sandboxHost : enviroment.proHost
        const key = sandbox ? enviroment.sandboxKey : enviroment.proKey

        const CURRENCIES = 'BTC,ETH,DASH,DOGE,LTC,USDT,BNB'

        const config = {
            method: 'get',
            url: `${host}/v1/cryptocurrency/ohlcv/historical`,
            params: {
                time_start,
                time_end,
                symbol: CURRENCIES,
                time_period: 'daily',
                interval: 'daily'
            },
            headers: {
                'X-CMC_PRO_API_KEY': key
            }
        }
        console.log(config)

        axios(config).then(response => {
            resolve(response.data)
        }).catch(error => {
            reject(error)
        })
    })
}

const Petition = async (url = "") => {
    const response = await fetch(url)
        .then(response => response.json())
        .then(json => {
            return json
        })

    return response
}

const validateAmount = (outputs = [], amount = 0) => {

    /**
     * precision decimals
     */
    const precision = 8

    for (let index = 0; index < outputs.length; index++) {
        const element = outputs[index]

        // monto de blockchain
        const a = _.floor(element, precision)



        // monto del usuario
        const b = _.floor(amount, precision)
        console.log({ a, b, amount, precision, element })
        // validamos si los montos son correctos
        if (a === b) {
            return true
        }
    }

    return false
}

const { WALLETS, WALLETSAPP, ALYHTTP, isValidHash } = require("../configuration/constant.config")

// Contiene todos los errores ya prescritos
const ERRORS = {
    AMOUNT: "No envió la cantidad requerida para aceptar su transacción",
    NOTFOUND: "No hemos encontrado en nuestra billetera su transacción",
    HASH: "Comprobación de hash incorrecta, intente nuevamente",
    CONFIRMATION: "Su transaccion esta en proceso, vuelva intentar mas tarde con el mismo hash",
    FORMAT: "El hash de transacción es incorrecto"
}

/**
 * Guarda todas las excepciones en el log 
 * -- --
 * @param {String} message 
 */
const badException = async (message = "") => {
    log(`hash.middleware.js - error: ${message}`)

    return {
        error: true,
        message,
    }
}

const binance = async (hash = "", amount = 0) => {
    try {
        // verificamos si el hash tiene un formato valido
        if (!isValidHash(hash)) {
            throw String(ERRORS.FORMAT)
        }

        const Response = await Petition(`https://dex-atlantic.binance.org/api/v1/tx/${hash}?format=json`)
        const outputs = []
        const addresses = []

        // verificamo si hay un error en la peticion
        // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
        if (Response.error) {
            throw String(ERRORS.HASH)
        }

        // verificamos que el hash sea igual al de blockchain
        if (Response.hash !== hash) {
            throw String(ERRORS.HASH)
        }
        const trx = Response.tx.value.msg[0].value

        if (!trx.inputs && !trx.outputs)
            throw 'Is not a transfer transaction'

        // mapeamos los valores comision y el valor de la transferncia
        trx.outputs.forEach(output => {
            output.coins.forEach(coin => {
                if (coin.denom.toLowerCase() === 'bnb')
                    outputs.push(parseFloat(coin.amount) * 0.00000001)
            })
        })
        trx.inputs.forEach(input => {
            addresses.push(input.address)
        })

        console.log(addresses, outputs)

        // verificamos si la transaccion se deposito a la wallet de la empresa
        if (!addresses.includes(WALLETS.BNB) && !addresses.includes('bnb1uq97h6z09d8alh0eewpek6c8ysmrvuq553tkp8')) {
            throw String(ERRORS.NOTFOUND)
        }

        // Validamos si la cantidad esta entre los fee y la cantidad exacta que retorna blockchain
        if (!validateAmount(outputs, amount)) {
            throw String(ERRORS.AMOUNT)
        }

        // retornamos un success (TODO ESTA CORRECTO)
        return success
    } catch (error) {
        return badException(error)
    }
}

test.skip('binances transaction validation', async done => {
    try {
        //const result = await getCMCOhlcvHistorical({ time_start: '2021-05-30', time_end: '2021-06-09' })
        const result = await binance('F27CE5CD53531E983B19E986730FB00D33874922C8C5D10A968044FDDAD48142', 24.52614541)
        console.log("el resultado", result)
    } catch (err) {
        console.log(err)
    }
    done()
})

const dummy = require('./prices.dummy.json')
const { CurrencyHistoryPriceModel } = require('../models')
const { sequelize } = require('../configuration/sql.config')
test.skip('insercion en historico', async done => {
    // console.log(dummy)
    // 1	Bitcoin
    // 2	Ethereum
    // 3	Litecoin
    // 4	Dash
    // 5	Tether
    // 6	DogeCoin
    // 7	Alycoin
    // 8	Ripple
    // 9	Binance
    const currencies = [
        {
            id: 1,
            symbol: 'BTC'
        },
        {
            id: 2,
            symbol: 'ETH'
        },
        {
            id: 3,
            symbol: 'LTC'
        },
        {
            id: 4,
            symbol: 'DASH'
        },
        {
            id: 5,
            symbol: 'USDT'
        },
        {
            id: 6,
            symbol: 'DOGE'
        },
        {
            id: 9,
            symbol: 'BNB'
        }]

    const t = await sequelize.transaction()
    try {
        for (let currency of currencies) {
            const objValues = dummy.data[currency.symbol]
            for (let quoteObj of objValues.quotes) {
                await CurrencyHistoryPriceModel.findOrCreate({
                    defaults: {
                        currency_id: currency.id,
                        high_price: quoteObj.quote.USD.high,
                        low_price: quoteObj.quote.USD.low,
                        open_price: quoteObj.quote.USD.open,
                        close_price: quoteObj.quote.USD.close,
                        time_high: quoteObj.time_high,
                        time_low: quoteObj.time_low,
                        time_open: quoteObj.time_open,
                        time_close: quoteObj.time_close,
                    },
                    where: {
                        currency_id: currency.id,
                        time_open: quoteObj.time_open,
                        time_close: quoteObj.time_close,
                    },
                    transaction: t
                })

                /*console.log({
                    currency_id: currency.id,
                    high_price: quoteObj.quote.USD.high,
                    low_price: quoteObj.quote.USD.low,
                    open_price: quoteObj.quote.USD.open,
                    close_price: quoteObj.quote.USD.close,
                    time_high: quoteObj.time_high,
                    time_low: quoteObj.time_low,
                    time_open: quoteObj.time_open,
                    time_close: quoteObj.time_close,
                })*/
            }
        }
        await t.commit()
    } catch (err) {
        console.log(err.message)
        await t.rollback()
    }
    done()
},40000)