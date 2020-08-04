const InputDataDecoder = require("ethereum-input-data-decoder")
const fetch = require("node-fetch")
const wirteLog = require("../logs/write.config")

const { WALLETS } = require("../configuration/constant.config")

// Contiene todos los errores ya prescritos
const ERRORS = {
    AMOUNT: "No envió la cantidad requerida para aceptar su transacción",
    NOTFOUND: "No hemos encontrado nuestra billetera en su transacción",
    HASH: "Comprobación de hash incorrecta, intente nuevamente",
    CONFIRMATION: "Su transaccion esta en proceso, vuelva intentar mas tarde con el mismo hash",
    WALLETNOTFOUND: "La billetera de error no existe"
}

/**
 * Guarda todas las excepciones en el log 
 * -- --
 * @param {String} message 
 */
const badException = async (message = "") => {
    await wirteLog(`hash.js - error: ${message}`)

    return {
        error: true,
        message,
    }
}

/**
 * Objeto que retornara cuando sea valida
 */
const success = {
    success: true
}

/**
 * Retorna la respuesta en formato JSON apartir de una peticion `fetch`
 * -- --
 * @param {String} url 
 */
const Petition = async (url = "") => {
    const response = await fetch(url)
        .then(response => response.json())
        .then(json => {
            return json
        })

    return response
}

const abiTemplate = {
    "abi": [
        {
            "constant": true,
            "inputs": [],
            "name": "name",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "generatedBy",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "endCrowdsale",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_from",
                    "type": "address"
                },
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "isMinting",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [
                {
                    "name": "",
                    "type": "uint8"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "_totalSupply",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "changeCrowdsaleRate",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "RATE",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "burnTokens",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "createTokens",
            "outputs": [],
            "payable": true,
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_owner",
                    "type": "address"
                },
                {
                    "name": "_spender",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "payable": true,
            "stateMutability": "payable",
            "type": "fallback"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "_from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "_to",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "_owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        }
    ]
}

/**
 * Paquete de metodos para validar hash con su monto 
 * y billeteras de Speed Tradings.
 * 
 * * Bitcoin
 * * Dash
 * * Litecoin
 * * Ethereum
 * * BitcoinVault
 * * Alycoin
 * 
 * -- --
 * 
 * @param {String} hash
 * @param {Number} amount * 
 */
const validateHash = {
    bitcoin: async (hash = "", amount = 0, wallet = WALLETS.BTC) => {
        const Response = await Petition(`https://api.blockcypher.com/v1/btc/main/txs/${hash}`)
        const outputs = []

        // Verificamos si hay error
        if (!Response.error) {
            await Response.outputs.forEach(output => outputs.push(parseFloat(output.value) * 0.00000001))

            if (Response.addresses.includes(wallet)) {
                if (outputs.includes(amount)) {
                    if (Response.confirmations < 3) {
                        return badException(ERRORS.CONFIRMATION)
                    }

                    return success
                } else {
                    return badException(ERRORS.AMOUNT)
                }
            } else {
                return badException(ERRORS.NOTFOUND)
            }

        } else {
            return badException(ERRORS.HASH)
        }
    },

    dash: async (hash = "", amount = 0) => {
        const Response = await Petition(`https://api.blockcypher.com/v1/dash/main/txs/${hash}`)
        const outputs = []

        if (!Response.error) {
            await Response.outputs.forEach(output => outputs.push(parseFloat(output.value) * 0.00000001))

            if (Response.addresses.includes(WALLETS.DASH)) {
                if (outputs.includes(amount)) {
                    if (Response.confirmations < 3) {
                        return badException(ERRORS.CONFIRMATION)
                    }

                    return success
                } else {
                    return badException(ERRORS.AMOUNT)
                }
            } else {
                return badException(ERRORS.NOTFOUND)
            }

        } else {
            return badException(ERRORS.HASH)
        }
    },

    litecoin: async (hash = "", amount = 0) => {
        const Response = await Petition(`https://api.blockcypher.com/v1/ltc/main/txs/${hash}`)
        const outputs = []

        if (!Response.error) {
            await Response.outputs.forEach(output => outputs.push(parseFloat(output.value) * 0.00000001))

            if (Response.addresses.includes(WALLETS.LTC)) {
                if (outputs.includes(amount)) {
                    if (Response.confirmations < 3) {
                        return badException(ERRORS.CONFIRMATION)
                    }

                    return success
                } else {
                    return badException(ERRORS.AMOUNT)
                }
            } else {
                return badException(ERRORS.NOTFOUND)
            }

        } else {
            return badException(ERRORS.HASH)
        }
    },

    // bitcoinVault: async (hash = "", amount = 0) => { },

    ethereum: async (hash = "", amount = 0, wallet = WALLETS.ETH) => {
        const Response = await Petition(`https://api.blockcypher.com/v1/eth/main/txs/${hash}`)
        const outputs = []

        if (!Response.error) {
            await Response.outputs.forEach(output => outputs.push(parseFloat(output.value) * 0.000000000000000001))

            const wcompay = wallet.substr(2).toLowerCase()

            if (Response.addresses.includes(wcompay)) {
                if (outputs.includes(amount)) {
                    if (Response.confirmations < 3) {
                        return badException(ERRORS.CONFIRMATION)
                    }

                    return success
                } else {
                    return badException(ERRORS.AMOUNT)
                }
            } else {
                return badException(ERRORS.NOTFOUND)
            }

        } else {
            return badException(ERRORS.NOTFOUND)
        }
    },

    alycoin: async (hash = "", amount = 0) => {
        const Response = await Petition(`https://api.blockcypher.com/v1/eth/main/txs/${hash}`)

        if (!Response.error) {
            const decoder = new InputDataDecoder(abiTemplate.abi)
            const result = decoder.decodeData(Response.outputs[0].script)

            const wcompay = WALLETS.ALY.substr(2).toString()

            if (result.inputs[0].toLowerCase() == wcompay.toLowerCase()) {
                const amountFromContract = parseFloat(result.inputs[1].words[0]) / 10000

                if (amountFromContract === amount) {
                    if (Response.confirmations < 3) {
                        return badException(ERRORS.CONFIRMATION)
                    }
                    return success
                } else {
                    return badException(ERRORS.AMOUNT)
                }
            } else {
                return badException(ERRORS.NOTFOUND)
            }

        } else {
            return badException(ERRORS.NOTFOUND)
        }
    },
}
module.exports = { ...validateHash, WALLETS }