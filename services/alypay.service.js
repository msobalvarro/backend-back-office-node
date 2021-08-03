const { ALYHTTP } = require('../configuration/constant.config')
const log = require('../logs/write.config')

const AlypayService = {}

/**
 * Obtiene el detalle de una wallet de alypay
 * @param {String} wallet
 */
AlypayService.getWallet = function (wallet) {
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await ALYHTTP.get(`/blockchain/wallet/${wallet}`)

            if (data.error) {
                resolve({})
                return
            }

            resolve(data)
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Verifica que se una wallet es de alypay, según el hash de las misma
 * @param  {Array<Object>} wallets - Lista de las wallets Alypay a verificar
 */
AlypayService.verifyWallet = function (...wallets) {
    return new Promise(async (resolve, reject) => {
        try {
            for (let item of wallets) {
                const { wallet = null, symbol = null, coinName = '' } = item

                if (!wallet || !symbol) {
                    continue
                }
                // se obtiene la info de la wallet
                const data = await AlypayService.getWallet(wallet)
                if (data.symbol !== symbol) {
                    reject(`Billetera Alypay ${coinName} no encontrada`)
                }
            }

            resolve(true)
        } catch (error) {
            log(`AlypayService.verifyWalletBTC: ${error}`)
            reject('Error al verificar la billetera Alypay')
        }
    })
}

module.exports = AlypayService
