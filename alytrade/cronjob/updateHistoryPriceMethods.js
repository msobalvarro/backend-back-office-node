const axios = require('axios').default
/**
 * Get Open High Lower and Close from alytrade Currencies in a date range
 * @param {{time_start:string,time_end}} options time_start and time_end are a string date in format 'YYYY-MM-DD' 
 * @param {boolean} sandbox if true, will request the CoinMarket Cap sandbox host else will request production host
 * @returns {Promise<{status:any, data:any}>} is a the response of CoinMarket Cap https://coinmarketcap.com/api/documentation/v1/#operation/getV1CryptocurrencyOhlcvHistorical
 */
const getCoinMarketCapOHLCHistorical = ({ time_start, time_end }, sandbox = true) => {
    return new Promise((resolve, reject) => {

        const enviroment = {
            sandboxHost: 'https://sandbox-api.coinmarketcap.com',
            proHost: 'https://pro-api.coinmarketcap.com',
            sandboxKey: '54bcf4d-1bca-4e8e-9a24-22ff2c3d462c',
            proKey: process.env.COINMARKETCAP_API
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

/**
 * Inserts in DB the MarketCap OHLC api Response 
 * @param {{status:any,data:any}} marketCapResponse JSON response from getCoinMarketCupOHLCHistorical()
 */
const insertOHLCRows = async marketCapResponse => {
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
    if (!marketCapResponse.data) {
        throw 'Marketcap Data is Undefined'
    }
    const t = await sequelize.transaction()
    try {
        for (let currency of currencies) {
            const objValues = marketCapResponse.data[currency.symbol]
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
}

module.exports = {
    getCoinMarketCapOHLCHistorical,
    insertOHLCRows
}