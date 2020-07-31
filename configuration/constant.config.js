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

const EMAILS = {
    DASHBOARD: "dashboard@speedtradings.com",
    EXCHANGE: "alyExchange@speedtradings.com",
    MANAGEMENT: "gerencia@speedtradings.com",
}

const WALLETSAPP = {
    BITCOIN: "3FALsBdWnBLTm6EC5DMyTntZBpAR9AhvmM",
    ETHEREUM: "0x166be843864bcba7235bcb62aa33aa4eadfef4ea"
}

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

module.exports = { EMAILS, WALLETSAPP, WALLETS, ALY, COMISSIONS }