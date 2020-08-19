const InputDataDecoder = require("ethereum-input-data-decoder")
const fetch = require("node-fetch")
const wirteLog = require("../logs/write.config")
const _ = require("lodash")
const { WALLETS } = require("../configuration/constant.config")

// Contiene todos los errores ya prescritos
const ERRORS = {
    AMOUNT: "No envió la cantidad requerida para aceptar su transacción",
    NOTFOUND: "No hemos encontrado en nuestra billetera su transacción",
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
    wirteLog(`hash.js - error: ${message}`)

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
 * Funcion de sistema inteligente que captura el monto preciso y valida el monto retornado por blockchain
 */
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

        // validamos si los montos son correctos
        if (a === b) {
            return true
        }
    }

    return false
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
    bitcoin: async (hash = "", amount = 0, WALLET = WALLETS.BTC) => {
        try {
            const Response = await Petition(`https://api.blockcypher.com/v1/btc/main/txs/${hash}`)
            const outputs = []

            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // mapeamos los valores comision y el valor de la transferncia
            Response.outputs.forEach(output => outputs.push(parseFloat(output.value) * 0.00000001))

            // verificamos si la transaccion se deposito a la wallet de la empresa
            if (!Response.addresses.includes(WALLET)) {
                throw String(ERRORS.NOTFOUND)
            }

            // Validamos si la cantidad esta entre los fee y la cantidad exacta que retorna blockchain
            if (!validateAmount(outputs, amount)) {
                throw String(ERRORS.AMOUNT)
            }

            // validamos si la transaccion tiene al menos 3 confirmacion
            if (Response.confirmations < 3) {
                throw String(ERRORS.CONFIRMATION)
            }

            // retornamos un success (TODO ESTA CORRECTO)
            return success
        } catch (error) {
            return badException(error)
        }
    },

    dash: async (hash = "", amount = 0) => {
        try {
            const Response = await Petition(`https://api.blockcypher.com/v1/dash/main/txs/${hash}`)
            const outputs = []

            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // mapeamos los valores comision y el valor de la transferncia
            Response.outputs.forEach(output => outputs.push(parseFloat(output.value) * 0.00000001))

            // verificamos si la transaccion se deposito a la wallet de la empresa
            if (!Response.addresses.includes(WALLETS.DASH)) {
                throw String(ERRORS.NOTFOUND)
            }

            // Validamos si la cantidad esta entre los fee y la cantidad exacta que retorna blockchain
            if (!validateAmount(outputs, amount)) {
                throw String(ERRORS.AMOUNT)
            }

            // validamos si la transaccion tiene al menos 3 confirmacion
            if (Response.confirmations < 3) {
                throw String(ERRORS.CONFIRMATION)
            }

            // retornamos un success (TODO ESTA CORRECTO)
            return success
        } catch (error) {
            return badException(error)
        }
    },

    litecoin: async (hash = "", amount = 0) => {
        try {
            const Response = await Petition(`https://api.blockcypher.com/v1/ltc/main/txs/${hash}`)
            const outputs = []

            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // mapeamos los valores comision y el valor de la transferncia
            Response.outputs.forEach(output => outputs.push(parseFloat(output.value) * 0.00000001))

            // verificamos si la transaccion se deposito a la wallet de la empresa
            if (!Response.addresses.includes(WALLETS.LTC)) {
                throw String(ERRORS.NOTFOUND)
            }

            // Validamos si la cantidad esta entre los fee y la cantidad exacta que retorna blockchain
            if (!validateAmount(outputs, amount)) {
                throw String(ERRORS.AMOUNT)
            }

            // validamos si la transaccion tiene al menos 3 confirmacion
            if (Response.confirmations < 3) {
                throw String(ERRORS.CONFIRMATION)
            }

            // retornamos un success (TODO ESTA CORRECTO)
            return success
        } catch (error) {
            return badException(error)
        }
    },

    ethereum: async (hash = "", amount = 0, WALLET = WALLETS.ETH) => {
        try {
            const Response = await Petition(`https://api.blockcypher.com/v1/eth/main/txs/${hash}`)
            const outputs = []

            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // Guardamos la direccion de la compania, quitandole el prefijo `0X` de ethereum
            const AddressCompany = WALLET.substr(2).toLowerCase()

            // mapeamos los valores comision y el valor de la transferncia
            Response.outputs.forEach(output => outputs.push((parseFloat(output.value) * 0.000000000000000001)).toFixed(8))

            // verificamos si la transaccion se deposito a la wallet de la empresa
            if (!Response.addresses.includes(AddressCompany)) {
                throw String(ERRORS.NOTFOUND)
            }

            // Validamos si la cantidad esta entre los fee y la cantidad exacta que retorna blockchain
            if (!validateAmount(outputs, amount)) {
                throw String(ERRORS.AMOUNT)
            }

            // validamos si la transaccion tiene al menos 3 confirmacion
            if (Response.confirmations < 3) {
                throw String(ERRORS.CONFIRMATION)
            }

            // retornamos un success (TODO ESTA CORRECTO)
            return success
        } catch (error) {
            return badException(error)
        }


    },

    alycoin: async (hash = "", amount = 0) => {
        try {
            const Response = await Petition(`https://api.blockcypher.com/v1/eth/main/txs/${hash}`)

            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // decodificamos al saber que cosa xd
            const decoder = new InputDataDecoder(abiTemplate.abi)
            const result = decoder.decodeData(Response.outputs[0].script)

            // Guardamos la direccion de la compania, quitandole el prefijo `0X` de ethereum
            const AddressCompany = WALLETS.ALY.substr(2).toString()


            // verificamos si la transaccion se deposito a la wallet de la empresa
            if (result.inputs[0].toLowerCase() !== AddressCompany.toLowerCase()) {
                throw String(ERRORS.NOTFOUND)
            }

            // calculamos el monto
            const amountFromContract = parseFloat(result.inputs[1].words[0]) / 10000

            // Validamos si la cantidad esta entre los fee y la cantidad exacta que retorna blockchain
            if (!validateAmount([amountFromContract], amount)) {
                throw String(ERRORS.AMOUNT)
            }

            // validamos si la transaccion tiene al menos 3 confirmacion
            if (Response.confirmations < 3) {
                throw String(ERRORS.CONFIRMATION)
            }

            // retornamos un success (TODO ESTA CORRECTO)
            return success

        } catch (error) {
            return badException(error)
        }
    },
}

module.exports = { ...validateHash, WALLETS }