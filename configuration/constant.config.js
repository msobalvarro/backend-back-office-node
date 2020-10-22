const { default: Axios } = require("axios")
const { generatePin } = require("secure-pin")
const moment = require("moment")

const { ALYPAY_API_KEY } = require("./vars.config")

// Contiene todas las wallets de la empresas
const WALLETS = {
    BTC: '1LN1cLYC5Qu4Phd1vZnMahtRQGLndvwBUn',
    ETH: '0xecb480b4c2eb89b71dfadbbb61511641ab7bfa8f',
    DASH: "XnfAkHxvjSVKARHhcBooWK97m95ATj7B3Y",
    LTC: "LLPhWvd9ZfDSDdZFVRfN6XJnLJUxdVqdqX",
    ALY: "0x166bE843864BcBa7235BCB62aA33Aa4EADFeF4eA",
    BTCV: "YZJgf9XrYTDFTMmA8aYDZAoRJQDYVof3Zt",
    XRP: "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh",
    USDT: "0xecb480b4c2eb89b71dfadbbb61511641ab7bfa8f",
    BCH: "1LN1cLYC5Qu4Phd1vZnMahtRQGLndvwBUn",
    EOS: "binancecleos",
    BNB: "bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23",
    NEO: "AGnG3CgMh4Kv343GSKKMhnhd6XjZSrLFfp",
    ZEC: "t1cGuspZg3Kb3Q9kGzPy8ZdcaNQQgMiXzzg",
}


// Comisiones por transaccion de exchange
const COMISSIONS = {
    BTC: 0,
    ETH: 0.0045,
    DASH: 0.003,
    LTC: 0.0015,
    ALY: 0,
    BTCV: 0.015,
    XRP: 0.375,
    USDT: 1.47,
    BCH: 0.0015,
    EOS: 0.15,
    BNB: 0.0015,
    NEO: 0.75,
    ZEC: 0.0075,
}


// Remitentes de correos
const EMAILS = {
    DASHBOARD: "dashboard@speedtradings.com",
    EXCHANGE: "alyExchange@speedtradings.com",
    MANAGEMENT: "gerencia@speedtradings.com",
}

// Wallets de las empresas que se muestran en la aplicacion
const WALLETSAPP = {
    BITCOIN: "188Q7Vw49bhtLY6KEBj21cb7E9nMS3XQAA",
    ETHEREUM: "0x86CaC6D24d8666d2A990afa4f3E3dAf7e79c8d2d",
    ALYPAY: {
        BITCOIN: "512de7d26763d1b1d02a6f77807c0d838441f77c04e0f6d32dd6d872610ddb455d589363cb9cff158491b2ac94a4f5c3094cc9df63d7911da186caa85eeb7964aa7289cb0d84d343754fb86d0005abe205d8e8255a0cb6a7908c3a3f28357fe3",
        ETHEREUM: "54295cfd19963fb31232d847d36c4c3460d207f9ff93dc7a3a76305dfc2ed5ff61dac7fd581d7d204af595e2fd1949497e8616946982781481776e0a34bdd04085314dcc26a11cf4a3fcebda6fafeb63ae40e21396ecf778e3672aefadec0245",
        ETHID: 478,
        BTCID: 477,
    },
    AIRTM: "tradingspeed4@gmail.com",
}


// informacion de la moneda alycoin
const ALY = {
    id: 0,
    name: "Alycoin",
    symbol: "ALY",
    quote: {
        USD: {
            price: 1
        }
    },
    wallet: WALLETS.ALY,
    comission: 0
}

/**
 * Constante que retorna la hora del servidor con la diferencia entre hora UTC y la hora local
 */
const NOW = () => {
    const now = new Date()

    // Constante que devuelve la diferencia horaria entre la hora UTC y la hora local, en minutos.
    // 360 min / en produccion no funciona el `getTimezoneOffset`
    // const timeMinutesOffset = 360
    const timeMinutesOffset = moment().toDate().getTimezoneOffset() * 2

    // convertimos en timestap el tiempo
    const timePast = moment(now).subtract(timeMinutesOffset, "minutes").toDate()

    return timePast
}

/**
 * Funcion que retorna pin de 6 digitos
 */
const GETPIN = () => new Promise((resolve, reject) => {
    try {
        generatePin(6, (pin) => resolve(parseInt(pin)))
    } catch (error) {
        reject(error)
    }
})


/**
 * Expresion regular para verificar/reemplazar caracteres 
 * especiales para hash de transacciones/billeteras
 */
const testRegexHash = /^[a-zA-Z0-9]+$/


/**
 * Funcion que retorna el hash de transacciion sin caracteres speciales
 */
const clearHash = (hash = "") => hash.replace(testRegexHash, "")

/**
 * Funcion que valida hash superficialmente de caracteres especiales 
 */
const isValidHash = (hash = "") => testRegexHash.test(hash)

// Url base para los endpoints de las transacciones
// const baseURL = "http://localhost:3002/api"
const baseURL = "https://alypay.uc.r.appspot.com/api"

const ALYHTTP = Axios.create({
    baseURL,
    headers: {
        "Authorization": ALYPAY_API_KEY
    }
})

module.exports = { EMAILS, WALLETSAPP, WALLETS, ALY, COMISSIONS, ALYHTTP, NOW, GETPIN, clearHash, isValidHash }