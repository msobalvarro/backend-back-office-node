const axios = require('axios').default
const _ = require('lodash')

/**
 * Get all crypto currency values(btc,eth,dash,ltc,usdt,doge) in usd
 * @param {Number} precision Decimals to show
 * @returns {{
 * btc:number,
 * eth:number,
 * dash:number,
 * ltc:number,
 * usdt:number,
 * doge:number}} An object with exchange rate between usd and alypay crypto currencies 
 */
const getUSDCryptoRate = async (precision) => {
    try {
        const precisionFunction = precision ? (n) => _.floor(n, precision) : (n) => n
        const url = 'https://ardent-medley-272823.appspot.com/collection/prices/minimal'
        const raw = (await axios.get(url)).data
        const result = {
            btc: precisionFunction(raw?.BTC?.quote?.USD?.price),
            eth: precisionFunction(raw?.ETH?.quote?.USD?.price),
            dash: precisionFunction(raw?.DASH?.quote?.USD?.price),
            ltc: precisionFunction(raw?.LTC?.quote?.USD?.price),
            usdt: precisionFunction(raw?.USDT?.quote?.USD?.price),
            doge: precisionFunction(raw?.DOGE?.quote?.USD?.price)
        }

        return result
    } catch (err) {
        console.log(err)
        throw err
    }
}

module.exports = {
    getUSDCryptoRate
}