const InputDataDecoder = require("ethereum-input-data-decoder")
const wirteLog = require("../logs/write")

// Contiene todas las wallets de la empresas
const WALLETS = {
    BTC: '3FALsBdWnBLTm6EC5DMyTntZBpAR9AhvmM',
    ETH: '0x166be843864bcba7235bcb62aa33aa4eadfef4ea',
    DASH: "",
    LTC: "",
    ALY: "",
}

// Contiene todos los errores ya prescritos
const ERRORS = {
    AMOUNT: "No envió la cantidad requerida para aceptar su transacción",
    NOTFOUND: "No hemos encontrado nuestra billetera en su transacción",
    HASH: "Comprobación de hash incorrecta e intente nuevamente",
    WALLETNOTFOUND: "La billetera de error no existe"
}

/**Guarda todas las excepciones en el log */
const badException = async (message = "") => {
    await wirteLog(`hash.js - error: ${message}`)

    return false
}

/**Retorna la respuesta en formato JSON apartir de una peticion `fetch` */
const Petition = async (url = "") => {
    await fetch(url)
        .then(response => response.json())
        .then(json => {
            return json
        })
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

const validateHash = (hash = "", coin = "", amount = 0) => {
    const arraymi = []

    switch (coin) {

        // ------------------------------ BITCOIN -----------------------------------
        case 'bitcoin':
            const cryptodate = await Petition(`https://api.blockcypher.com/v1/btc/main/txs/${hash}`)

            // Verificamos si hay error
            if (!cryptodate.error) {
                cryptodate.outputs.forEach(output => {
                    arraymi.push((((parseFloat(output.value) * 0.00000001).toFixed(8)).toString()))
                })

                if (cryptodate.addresses.includes(WALLETS.BTC)) {
                    if (arraymi.includes(amount.toString())) {
                        return true
                    } else {
                        badException(ERRORS.AMOUNT)
                    }
                } else {
                    badException(ERRORS.NOTFOUND)
                }

            } else {
                badException(ERRORS.HASH)
            }
            break


        // ------------------------------ DASH -----------------------------------
        case 'dash':
            const cryptodate2 = await Petition(`https://api.blockcypher.com/v1/dash/main/txs/${hash}`)

            if (!cryptodate2.error) {
                cryptodate2.outputs.forEach(output => arraymi.push(parseFloat(output.value) * 0.00000001))

                if (cryptodate2.addresses.includes(WALLETS.DASH)) {
                    if (arraymi.includes(amount)) {
                        try {
                            // let is_w = (is_user == true) ? getDetailInvoice.receiveCurrency.name.toLowerCase() : undefined
                            // let wallet = await this.getWalletsByEmailUser(email, is_w)
                            // if (wallet != undefined) {
                            //     let typeChangeByCountry = await this.getExchange(datecountry[0].country, date)
                            //     let exchance = (typeChangeByCountry != undefined && typeChangeByCountry.value != null) ? typeChangeByCountry.value : 0
                            //     let transactiontype = await this.getTransactionType('RS')
                            //     let exchanging = (getDetailInvoice.total * exchance).toFixed(2)
                            //     let result = await this.registerDeposit(wallet.id, transactiontype.id, paymethodCrypto.id, parseFloat(exchanging), getDetailInvoice.amountCrypto, is_user, `Recarga saldo de ${getDetailInvoice.receiveCurrency.name.toLowerCase()}`, getDetailInvoice, packageA, user, hash, date, datecountry, invoice)

                            //     if (result) {
                            //         let updateInvoice = await this.alycoinInvoiceService.getByNumFact(invoice)
                            //         updateInvoice.state = true
                            //         this.alycoinInvoiceService.update(updateInvoice)

                            //         let hasconfirmedinput = new HashConfirmedInput()
                            //         hasconfirmedinput.invoiceId = invoice
                            //         hasconfirmedinput.urlCheck = `https://live.blockcypher.com/${getDetailInvoice.receiveCurrency.iso.toLowerCase()}/tx/`
                            //         hasconfirmedinput.hash = hash
                            //         this.hashconfirmedservice.regiterHash(hasconfirmedinput)
                            //         return result
                            //     }
                            // }
                            // HttpException(ERRORS.WALLETNOTFOUND)

                            return true

                        } catch (error) {
                            badException(`error system ${error}`)
                        }
                    } else {
                        badException(ERRORS.AMOUNT)
                    }
                } else {
                    badException(ERRORS.NOTFOUND)
                }

            } else {
                badException(ERRORS.HASH)
            }
            break

        // ------------------------------ LITECOIN -----------------------------------
        case 'litecoin':

            const cryptodate3 = await Petition(`https://api.blockcypher.com/v1/ltc/main/txs/${hash}`)
            if (!cryptodate3.error) {

                cryptodate3.outputs.forEach(output => {
                    arraymi.push(parseFloat(output.value) * 0.00000001)
                })

                if (cryptodate3.addresses.includes(WALLETS.LTC)) {
                    if (arraymi.includes(amount)) {
                        try {
                            // let is_w = (is_user == true) ? getDetailInvoice.receiveCurrency.name.toLowerCase() : undefined
                            // let wallet = await this.getWalletsByEmailUser(email, is_w)
                            // if (wallet != undefined) {
                            //     let typeChangeByCountry = await this.getExchange(datecountry[0].country, date)
                            //     let exchance = (typeChangeByCountry != undefined && typeChangeByCountry.value != null) ? typeChangeByCountry.value : 0
                            //     let transactiontype = await this.getTransactionType('RS')
                            //     let exchanging = (getDetailInvoice.total * exchance).toFixed(2)
                            //     let result = await this.registerDeposit(wallet.id, transactiontype.id, paymethodCrypto.id, parseFloat(exchanging), getDetailInvoice.amountCrypto, is_user, `Recarga saldo de ${getDetailInvoice.receiveCurrency.name.toLowerCase()}`, getDetailInvoice, packageA, user, hash, date, datecountry, invoice)

                            //     if (result) {
                            //         let updateInvoice = await this.alycoinInvoiceService.getByNumFact(invoice)
                            //         updateInvoice.state = true
                            //         this.alycoinInvoiceService.update(updateInvoice)

                            //         let hasconfirmedinput = new HashConfirmedInput()
                            //         hasconfirmedinput.invoiceId = invoice
                            //         hasconfirmedinput.urlCheck = `https://live.blockcypher.com/${getDetailInvoice.receiveCurrency.iso.toLowerCase()}/tx/`
                            //         hasconfirmedinput.hash = hash
                            //         this.hashconfirmedservice.regiterHash(hasconfirmedinput)
                            //         return result
                            //     }
                            // }
                            // HttpException(ERRORS.WALLETNOTFOUND)
                            return true
                        } catch (error) {
                            badException(`error system ${error}`)
                        }
                    } else {
                        badException(ERRORS.AMOUNT)
                    }
                } else {
                    badException(ERRORS.NOTFOUND)
                }

            } else {
                badException(ERRORS.HASH)
            }
            break


        // ------------------------------ ETHEREUM -----------------------------------
        case 'ethereum':

            const cryptodate4 = await Petition(`https://api.blockcypher.com/v1/eth/main/txs/${hash}`)

            if (!cryptodate4.error) {
                cryptodate4.outputs.forEach(output => arraymi.push(parseFloat(output.value) * 0.000000000000000001))
                
                const wcompay = WALLETS.ETH.substr(2).toLowerCase()

                if (cryptodate4.addresses.includes(wcompay)) {
                    if (arraymi.includes(amount)) {
                        try {
                            // let is_w = (is_user == true) ? getDetailInvoice.receiveCurrency.name.toLowerCase() : undefined
                            // let wallet = await this.getWalletsByEmailUser(email, is_w)
                            // if (wallet != undefined) {
                            //     let typeChangeByCountry = await this.getExchange(datecountry[0].country, date)
                            //     let exchance = (typeChangeByCountry != undefined && typeChangeByCountry.value != null) ? typeChangeByCountry.value : 0
                            //     let transactiontype = await this.getTransactionType('RS')
                            //     let exchanging = (getDetailInvoice.total * exchance).toFixed(2)
                            //     let result = await this.registerDeposit(wallet.id, transactiontype.id, paymethodCrypto.id, parseFloat(exchanging), getDetailInvoice.amountCrypto, is_user, `Recarga saldo de ${getDetailInvoice.receiveCurrency.name.toLowerCase()}`, getDetailInvoice, packageA, user, hash, date, datecountry, invoice)
                            //     if (result) {
                            //         let updateInvoice = await this.alycoinInvoiceService.getByNumFact(invoice)
                            //         updateInvoice.state = true
                            //         this.alycoinInvoiceService.update(updateInvoice)

                            //         let hasconfirmedinput = new HashConfirmedInput()
                            //         hasconfirmedinput.invoiceId = invoice
                            //         hasconfirmedinput.urlCheck = `https://live.blockcypher.com/${getDetailInvoice.receiveCurrency.iso.toLowerCase()}/tx/`
                            //         hasconfirmedinput.hash = hash
                            //         this.hashconfirmedservice.regiterHash(hasconfirmedinput)
                            //         return result
                            //     }
                            // }
                            // HttpException(ERRORS.WALLETNOTFOUND)

                            return true
                        } catch (error) {
                            badException(`error system ${error}`)
                        }
                    } else {
                        badException(ERRORS.AMOUNT)
                    }
                } else {
                    badException(ERRORS.NOTFOUND)
                }

            } else {
                badException(ERRORS.NOTFOUND)
            }
            break

        // ------------------------------ ALYCOIN -----------------------------------
        case 'alycoin':
            const cryptodate5 = await Petition(`https://api.blockcypher.com/v1/eth/main/txs/${hash}`)

            if (!cryptodate5.error) {
                const decoder = new InputDataDecoder(abiTemplate.abi)
                const result = decoder.decodeData(cryptodate5.outputs[0].script)

                const wcompay = WALLETS.ALY.substr(2).toString()

                if (result.inputs[0] == wcompay) {
                    const amountFromContract = parseFloat(result.inputs[1].words[0]) / 10000
                    
                    if (amountFromContract <= amount) {
                        try {
                            // let is_w = (is_user == true) ? getDetailInvoice.receiveCurrency.name.toLowerCase() : undefined
                            // let wallet = await this.getWalletsByEmailUser(email, is_w)
                            // if (wallet != undefined) {
                            //     let typeChangeByCountry = await this.getExchange(datecountry[0].country, date)
                            //     let exchance = (typeChangeByCountry != undefined && typeChangeByCountry.value != null) ? typeChangeByCountry.value : 0
                            //     let transactiontype = await this.getTransactionType('RS')
                            //     let exchanging = (getDetailInvoice.total * exchance).toFixed(2)
                            //     let result = await this.registerDeposit(wallet.id, transactiontype.id, paymethodCrypto.id, parseFloat(exchanging), getDetailInvoice.amountCrypto, is_user, `Recarga saldo de ${getDetailInvoice.receiveCurrency.name.toLowerCase()}`, getDetailInvoice, packageA, user, hash, date, datecountry, invoice)
                            //     if (result) {
                            //         let updateInvoice = await this.alycoinInvoiceService.getByNumFact(invoice)
                            //         updateInvoice.state = true
                            //         this.alycoinInvoiceService.update(updateInvoice)

                            //         let hasconfirmedinput = new HashConfirmedInput()
                            //         hasconfirmedinput.invoiceId = invoice
                            //         hasconfirmedinput.urlCheck = `https://live.blockcypher.com/${getDetailInvoice.receiveCurrency.iso.toLowerCase()}/tx/`
                            //         hasconfirmedinput.hash = hash
                            //         this.hashconfirmedservice.regiterHash(hasconfirmedinput)
                            //         return result
                            //     }
                            // }
                            // badException(ERRORS.WALLETNOTFOUND)

                            return true
                        } catch (error) {
                            badException(`error system ${error}`)
                        }
                    } else {
                        badException(ERRORS.AMOUNT)
                    }
                } else {
                    badException(ERRORS.NOTFOUND)
                }

            } else {
                badException(ERRORS.NOTFOUND)
            }
            break
        default:
            badException("select an available method")
    }
}

module.exports = validateHash