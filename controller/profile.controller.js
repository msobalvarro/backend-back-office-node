const express = require('express')
const router = express.Router()


// import constants and funcitons
const axios = require("axios")
const Crypto = require('crypto-js')
const WriteError = require('../logs/write.config')

// import middlewares
const { check, validationResult } = require('express-validator')
const auth = require('../middleware/auth.middleware')

// Imports mysql config
const { updateWallets, login, getInfoProfile } = require('../configuration/queries.sql')
const query = require('../configuration/query.sql')

// enviroment
const { JWTSECRET } = require("../configuration/vars.config")

const httpWallet = async (wallet = "") => {
    const { data } = await axios.get(`https://alypay.uc.r.appspot.com/wallets/verify/${wallet}`)

    return data
}

router.post("/update-photo", auth, (req, res) => {
    try {

    } catch (error) {
        /**Error information */
        WriteError(`profile.js - error al actualizar foto | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

const checkValidation = [
    auth,
    [
        check("id_user", "id_user is required").exists().isInt(),
        check("btc", "Wallet en BTC es requerido").exists(),
        check("eth", "Wallet en ETH es requerido").exists(),
        check("password", "password is required").exists(),
        check("email", "email is requerid").exists(),
    ]
]

// controlador para actualizar direcciones wallets
router.post('/update-wallet', checkValidation, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { id_user } = req.user

        const { btc, eth, aly_btc, aly_eth, payWithAlypay, password, email } = req.body

        // actualizamos la wallets de speedTradings
        await query.withPromises(updateWallets, [btc, eth, id_user])

        // verificamos si el cliente ocupa pago en AlyPay
        if (payWithAlypay !== undefined) {
            // const params

            const sql = `
                UPDATE wallet_alypay 
                SET btc = ?, 
                    eth = ?,
                    state = ?
                WHERE (id_user = ?);
            `

            const paramsAlyWallet = []

            // verifcamos si la wallert en bitcoin es de alypay
            if (aly_btc.trim().length > 0) {
                const data = await httpWallet(aly_btc)

                // verificamos si la wallet es correcta
                if (data.error) {
                    throw String(data.message)
                } else {
                    // verificamos si la wallet es de bitcoin
                    if (data.symbol !== "BTC") {
                        throw String("Tu billetera AlyPay no es de bitcoin")
                    }

                    // agregamos la billetera alycoin verificada
                    paramsAlyWallet.push(aly_btc)
                }

            } else {
                // agregamos el campo de bitcoin null
                paramsAlyWallet.push(null)
            }


            // verifcamos si la wallert en ethereum es de alypay
            if (aly_eth.trim().length > 0) {
                const data = await httpWallet(aly_eth)

                // verificamos si la wallet es correcta
                if (data.error) {
                    throw String(data.message)
                } else {
                    // verificamos si la wallet es de ethereum
                    if (data.symbol !== "ETH") {
                        throw String("Tu billetera AlyPay no es de ethereum")
                    }

                    // agregamos la billetera alycoin verificada
                    paramsAlyWallet.push(aly_eth)
                }

            } else {
                // agregamos el campo de bitcoin null
                paramsAlyWallet.push(null)
            }

            // verificamos si el usuario quire recibir pagos en alypay
            // 1 - Recibir pagos
            // 0 - no recibir pagos pero si guardar mi wallet
            paramsAlyWallet.push(payWithAlypay === true ? 1 : 0)

            // agregamos el id del usuario quien guarda esta accion
            paramsAlyWallet.push(id_user)

            await query.withPromises(sql, paramsAlyWallet)
        }

        const results = await query.withPromises(login, [email, Crypto.SHA256(password, JWTSECRET).toString()])

        if (results[0].length > 0) {
            const token = req.header('x-auth-token')

            /**Const return data db */
            const result = Object.assign(results[0][0], { token })

            res.send(result)
        }
        else {
            throw String("Tu contraseña es incorrecta")
        }
    } catch (error) {
        /**Error information */
        WriteError(`profile.js - error al actualizar wallet | ${error}`)

        const response = {
            error: true,
            message: error
        }

        res.send(response)
    }
})

router.get('/info', auth, async (req, res) => {
    try {
        const { id_user: id } = req.user

        if (id) {
            const response = await query.withPromises(getInfoProfile, [id])

            res.send(response[0][0])
        } else {
            throw String("El parametro ID es requerido")
        }

    } catch (error) {
        const response = {
            error: true,
            message: error.toString()
        }

        res.send(response)
    }
})

module.exports = router