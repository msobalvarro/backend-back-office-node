const express = require("express")
const router = express.Router()

// import constants and functions
const Crypto = require("crypto-js")
const log = require("../../logs/write.config")
const fetch = require("node-fetch")
const { WALLETSAPP, eventSocketNames, socketAdmin, responseSuccess } = require("../../configuration/constant.config")
const { JWTSECRET } = require("../../configuration/vars.config")
const { default: validator } = require("validator")
const _ = require("lodash")

// import middlewares
const { authRoot } = require("../../middleware/auth.middleware")

// import mysql configuration
const sql = require("../../configuration/sql.config")
const { updateUserStatus } = require("../../configuration/queries.sql")

/**
 * Retorna la respuesta en formato JSON apartir de una peticion `fetch`
 * -- --
 * @param {String} url 
 */
const Petition = (url = "") => new Promise(async (resolve, reject) => {
    try {
        const response = await fetch(url)
            .then(response => response.json())
            .then(json => {
                return json
            })

        resolve(response)
    } catch (error) {
        reject(error)
    }
})

/**
 * Funcion de sistema inteligente que captura el monto preciso y valida el monto retornado por blockchain
 */
const SearchAmounts = (outputs = []) => new Promise((resolve, reject) => {
    try {
        /**
         * precision decimals
         */
        const precision = 8

        // Creamos arreglo para almacenar los montos encontrados
        const amounts = []

        for (let index = 0; index < outputs.length; index++) {
            const element = outputs[index]

            // monto de blockchain
            const a = _.floor(element, precision)

            amounts.push(a)
        }

        resolve(amounts)
    } catch (error) {
        reject(error)
    }
})

/**
 * Funcion que retorna informacion nutritiva de un hash
 */
const HashInformation = (hash = "", type = "btc", WALLET = WALLETSAPP.BITCOIN) => new Promise(async (resolve, reject) => {
    try {
        const Response = await Petition(`https://api.blockcypher.com/v1/${type.toLowerCase()}/main/txs/${hash}?limit=100`)

        // verificamos si ahy algun error
        if (Response.error) {
            throw String("Transaction not found")
        }


        // salida de montos
        const outputs = []

        // monto a multiplicar
        const multiplyAmount = type === "btc" ? 0.00000001 : 0.000000000000000001

        // ingresamo los montos multiplicados
        Response.outputs.forEach(output => outputs.push((parseFloat(output.value) * multiplyAmount)))

        const data = {
            hash: hash,
            deposited: Response.addresses.includes(type === "btc" ? WALLET : WALLET.substr(2).toLowerCase()),
            amounts: await SearchAmounts(outputs),
            confirmations: Response.confirmations,
            confirmed: new Date(Response.confirmed),
            received: new Date(Response.received),
            addresses: Response.addresses,
            preference: Response.preference,
        }

        resolve(data)

    } catch (error) {
        log(error.toString())

        reject(error)
    }
})


/**Controlador que retorna informacion provicional para la plataforma */
router.get("/", (_, res) => {
    const { connected } = socketAdmin.sockets.clients()


    res.send({
        eventSocketNames,

        // total de clientes conectados
        totalClients: Object.keys(connected).length
    })
})

// Controlador que codifica un string
router.post("/code-password", (req, res) => {
    const { password } = req.body

    const passwordEncrypted = Crypto.SHA256(password, JWTSECRET).toString()

    res.send({ passwordEncrypted })
})


router.post("/activate-account", authRoot, async (req, res) => {
    try {
        const { email, active } = req.body

        console.log(req.body)

        // Validamos el correo
        if (!validator.isEmail(email))
            throw String("Correo invalido")

        // Validamos el parametro active
        if (typeof active !== "boolean")
            throw String("parametro `active` es requerido")

        // ejecutamos la consulta
        await sql.run(updateUserStatus, [active ? 1 : 0, email])

        // enviamos la respuesta del server
        res.send(responseSuccess)
    } catch (error) {
        log(`utils.admin.controller.js - ${error.toString()}`)

        res.send({ error: true, message: error.toString() })
    }
})

/**
 * Controlador que obtiene informacion del hash
 * 
 * @param {string} type
 * @param {string} hash
 */
router.get("/hash/:type/:hash", async (req, res) => {
    try {
        const { hash, type } = req.params

        // validamos si el simbolo esta dispoible
        if (type !== "btc" && type !== "eth") {
            throw String("Symbol is not available")
        }

        // validamos si existe un hash
        if (!hash) {
            throw String("Hash is required")
        }

        // elegimos la wallet dependiendo del simbolo btc/eth
        const walletAddress = type === "btc" ? WALLETSAPP.BITCOIN : WALLETSAPP.ETHEREUM

        // ejecutamos la busqueda de informacion
        const info = await HashInformation(hash, type, walletAddress)

        res.send(info)
    } catch (error) {
        log(`utils.admin.controller.js - ${error.toString()}`)

        res.send({ error: true, message: error.toString() })
    }
})

module.exports = router