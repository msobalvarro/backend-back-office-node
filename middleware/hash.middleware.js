const InputDataDecoder = require("ethereum-input-data-decoder")
const fetch = require("node-fetch")
const log = require("../logs/write.config")
const _ = require("lodash")
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

        console.log(a)

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
 * Funcion que valida las transacciones alypay
 */
const AlyPayTransaction = async (hash = "", amount = 0, wallet = WALLETSAPP.ALYPAY.BTCID) => {
    try {
        // ejecutamos la peticion al apy de alychain
        const { data: dataAlyTransaction } = await ALYHTTP.get(`/blockchain/transaction/${hash}`)

        // verificamos si el hash de transaccion existe en alychain
        if (Object.values(dataAlyTransaction).length === 0) {
            throw String(ERRORS.NOTFOUND)
        }

        // validamos que se recibo en la de la empresa
        if (dataAlyTransaction.id_wallet_to !== wallet) {
            throw String(ERRORS.NOTFOUND)
        }

        // validamos si el monto es correcto
        if (dataAlyTransaction.amount !== amount) {
            throw String(ERRORS.AMOUNT)
        }

        return success
    } catch (error) {
        return badException(error)
    }
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
            console.log(isValidHash(hash))

            // verificamos si el hash tiene un formato valido
            if (!isValidHash(hash)) {
                throw String(ERRORS.FORMAT)
            }

            const Response = await Petition(`https://api.blockcypher.com/v1/btc/main/txs/${hash}?limit=100`)
            const outputs = []


            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // verificamos que el hash sea igual al de blockchain
            if (Response.hash !== hash) {
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
            // if (Response.confirmations < 3) {
            //     throw String(ERRORS.CONFIRMATION)
            // }

            // retornamos un success (TODO ESTA CORRECTO)
            return success
        } catch (error) {
            return badException(error)
        }
    },

    dash: async (hash = "", amount = 0) => {
        try {
            // verificamos si el hash tiene un formato valido
            if (!isValidHash(hash)) {
                throw String(ERRORS.FORMAT)
            }

            const Response = await Petition(`https://api.blockcypher.com/v1/dash/main/txs/${hash}`)
            const outputs = []

            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // verificamos que el hash sea igual al de blockchain
            if (Response.hash !== hash) {
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
            // if (Response.confirmations < 3) {
            //     throw String(ERRORS.CONFIRMATION)
            // }

            // retornamos un success (TODO ESTA CORRECTO)
            return success
        } catch (error) {
            return badException(error)
        }
    },

    litecoin: async (hash = "", amount = 0) => {
        try {
            // verificamos si el hash tiene un formato valido
            if (!isValidHash(hash)) {
                throw String(ERRORS.FORMAT)
            }

            const Response = await Petition(`https://api.blockcypher.com/v1/ltc/main/txs/${hash}`)
            const outputs = []

            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // verificamos que el hash sea igual al de blockchain
            if (Response.hash !== hash) {
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
            // if (Response.confirmations < 3) {
            //     throw String(ERRORS.CONFIRMATION)
            // }

            // retornamos un success (TODO ESTA CORRECTO)
            return success
        } catch (error) {
            return badException(error)
        }
    },

    ethereum: async (hash = "", amount = 0, WALLET = WALLETS.ETH) => {
        try {
            // verificamos si el hash tiene un formato valido
            if (!isValidHash(hash)) {
                throw String(ERRORS.FORMAT)
            }

            const Response = await Petition(`https://api.blockcypher.com/v1/eth/main/txs/${hash}`)
            const outputs = []

            console.log(Response)

            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // verificamos que el hash sea igual al de blockchain
            if (Response.hash !== hash.substr(2)) {
                throw String(ERRORS.HASH)
            }

            // Guardamos la direccion de la compania, quitandole el prefijo `0X` de ethereum
            const AddressCompany = WALLET.substr(2).toLowerCase()

            // mapeamos los valores comision y el valor de la transferncia
            Response.outputs.forEach(output => outputs.push((parseFloat(output.value) * 0.000000000000000001)).toFixed(8))

            console.log(outputs)


            // verificamos si la transaccion se deposito a la wallet de la empresa
            if (!Response.addresses.includes(AddressCompany)) {
                throw String(ERRORS.NOTFOUND)
            }

            // Validamos si la cantidad esta entre los fee y la cantidad exacta que retorna blockchain
            if (!validateAmount(outputs, amount)) {
                throw String(ERRORS.AMOUNT)
            }

            // validamos si la transaccion tiene al menos 3 confirmacion
            // if (Response.confirmations < 3) {
            //     throw String(ERRORS.CONFIRMATION)
            // }

            // retornamos un success (TODO ESTA CORRECTO)
            return success
        } catch (error) {
            return badException(error)
        }


    },

    alycoin: async (hash = "", amount = 0) => {
        try {
            // verificamos si el hash tiene un formato valido
            if (!isValidHash(hash)) {
                throw String(ERRORS.FORMAT)
            }

            const Response = await Petition(`https://api.blockcypher.com/v1/eth/main/txs/${hash}`)

            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // verificamos que el hash sea igual al de blockchain
            if (Response.hash !== hash.substr(2)) {
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
            // if (Response.confirmations < 3) {
            //     throw String(ERRORS.CONFIRMATION)
            // }

            // retornamos un success (TODO ESTA CORRECTO)
            return success

        } catch (error) {
            return badException(error)
        }
    },

    doge: async (hash = "", amount = 0) => {
        try {
            // verificamos si el hash tiene un formato valido
            if (!isValidHash(hash)) {
                throw String(ERRORS.FORMAT)
            }

            const Response = await Petition(`https://api.blockcypher.com/v1/doge/main/txs/${hash}`)
            const outputs = []

            // verificamo si hay un error en la peticion
            // Este error de peticion la retorna el servidor blockchain cuando no existe esta transaccion
            if (Response.error) {
                throw String(ERRORS.HASH)
            }

            // verificamos que el hash sea igual al de blockchain
            if (Response.hash !== hash) {
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
            // if (Response.confirmations < 3) {
            //     throw String(ERRORS.CONFIRMATION)
            // }

            // retornamos un success (TODO ESTA CORRECTO)
            return success
        } catch (error) {
            return badException(error)
        }
    },
    binance: async (hash = "", amount = 0) => {
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
                    if(coin.denom.toLowerCase() === 'bnb')
                        outputs.push(parseFloat(coin.amount) * 0.00000001)
                })
            })
            trx.inputs.forEach(input => {
                addresses.push(input.address)
            })
    
            console.log(addresses,outputs)
    
            // verificamos si la transaccion se deposito a la wallet de la empresa
            if (!addresses.includes(WALLETS.BNB)) {
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
}

module.exports = { ...validateHash, WALLETS, ERRORS, AlyPayTransaction }