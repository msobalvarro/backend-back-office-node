const axios = require('axios').default

const getCMCOhlcvHistorical = ({ time_start, time_end }, sandbox = true) => {
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

module.exports = {
    getCMCOhlcvHistorical
}