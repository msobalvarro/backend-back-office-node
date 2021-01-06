const express = require('express')
const router = express.Router()


// import constants and funcitons
const { ALYHTTP } = require("../configuration/constant.config")
const Crypto = require('crypto-js')
const WriteError = require('../logs/write.config')

// import middlewares
const { check, validationResult } = require('express-validator')
const { auth } = require('../middleware/auth.middleware')

// Imports mysql config
const {
    updateWallets,
    login,
    getInfoProfile,
    updateWalletAlyPay,
    getUserAvatarPictureId,
    getKycUserById,
    getKycUserBeneficiaryById,
    getKycEcommerceById,
    getKycEcommerceBeneficiariesById,
    getKycEcommerceLegalRepresentativeById
} = require('../configuration/queries.sql')
const sql = require('../configuration/sql.config')

// enviroment
const { JWTSECRET } = require("../configuration/vars.config")

const httpWallet = async (wallet = "") => {
    const { data } = await ALYHTTP.get(`/wallet/verify/${wallet}`)

    return data
}

router.post("/update-photo", auth, (_, res) => {
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

        const results = await sql.run(login, [email, Crypto.SHA256(password, JWTSECRET).toString()])

        if (results[0].length > 0) {
            // actualizamos la wallets de speedTradings
            await sql.run(updateWallets, [btc, eth, id_user])

            // verificamos si el cliente ocupa pago en AlyPay
            if (payWithAlypay !== undefined) {
                // const params

                const paramsAlyWallet = []

                // verifcamos si la wallert en bitcoin es de alypay
                if (aly_btc.trim().length > 0) {
                    const data = await httpWallet(aly_btc.trim())

                    // verificamos si la wallet es correcta
                    if (data.error) {
                        throw String("Tu billetera alypay de Bitcoin no se ha podido verificar")
                    } else {
                        // verificamos si la wallet es de bitcoin
                        if (data.symbol !== "BTC") {
                            throw String("Tu billetera AlyPay no es de bitcoin")
                        }

                        // agregamos la billetera alycoin verificada
                        paramsAlyWallet.push(aly_btc.trim())
                    }

                } else {
                    // agregamos el campo de bitcoin null
                    paramsAlyWallet.push(null)
                }


                // verifcamos si la wallert en ethereum es de alypay
                if (aly_eth.trim().length > 0) {
                    const data = await httpWallet(aly_eth.trim())

                    // verificamos si la wallet es correcta
                    if (data.error) {
                        throw String("Tu billetera alypay de Ethereum no se ha podido verificar")
                    } else {
                        // verificamos si la wallet es de ethereum
                        if (data.symbol !== "ETH") {
                            throw String("Tu billetera AlyPay no es de ethereum")
                        }

                        // agregamos la billetera alycoin verificada
                        paramsAlyWallet.push(aly_eth.trim())
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

                // ejecutamos consulta de actualizacion
                await sql.run(updateWalletAlyPay, paramsAlyWallet)
            }

            // obtenemos el token
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

/**
 * Obtiene la información del perfil del usuario
*/
router.get('/info', auth, async (req, res) => {
    try {
        const { id_user: id } = req.user

        if (id) {
            const response = await sql.run(getInfoProfile, [id])
            // Captura el id de la imagen de perfil del usuario
            const resultAvatar = await sql.run(getUserAvatarPictureId, [id])

            res.send({
                ...response[0][0],
                avatar: (resultAvatar.length > 0)
                    ? resultAvatar[0].id
                    : null
            })
        } else {
            throw String("El parametro ID es requerido")
        }

    } catch (error) {
        WriteError(`profile.controller.js - Error al obtener el perfil del usuario | ${error}`)

        res.send({
            error: true,
            message: error.toString()
        })
    }
})

/**
 * Obtiene la información kcy del usuario
 */
router.get('/kyc', auth, async (req, res) => {
    try {
        // Se obtiene el id del usuario y el tipo de kyc
        const { id_user: id, kyc_type } = req.user

        // Almacenará la repuesta final que se enviará al cliente
        let response = {}

        // Si el kyc es de un usuario natural
        if (kyc_type === 1) {
            // Obtiene la información del usuario
            const resultInformationKycUser = await sql.run(getKycUserById, [id])

            // Obtiene la información del beneficiario
            const resultInformationKycUserBeneficiary = await sql.run(getKycUserBeneficiaryById, [id])

            // Se construye el objeto de respuesta
            response = {
                ...resultInformationKycUser[0],
                beneficiary: resultInformationKycUserBeneficiary[0]
            }
        }

        // Si el kyc es de una empresa
        if (kyc_type === 2) {
            // Obtiene la información general del comercio
            const resultInformationKycEcommerce = await sql.run(getKycEcommerceById, [id])

            // Obtiene la información de los beneficiarios
            const resultInformationKycEcommerceBeneficiaries = await sql.run(getKycEcommerceBeneficiariesById, [id])

            // Obtiene la información del representante legal
            const resultInformationKycEcommerceLegalRepresentative = await sql.run(getKycEcommerceLegalRepresentativeById, [id])

            // Se contruye el objeto de respuesta
            response = {
                ...resultInformationKycEcommerce[0],
                legalRepresentative: resultInformationKycEcommerceLegalRepresentative[0],
                ...(resultInformationKycEcommerceBeneficiaries.length > 0)
                    ? {
                        beneficiaries: resultInformationKycEcommerceBeneficiaries
                    }
                    : {}
            }
        }

        // Se envía le respuesta obtenida
        res.send(response)
    } catch (message) {
        WriteError(`profile.controller.js | Error al obtener kyc del usuario | ${message.toString()}`)

        res.send({
            error: true,
            message
        })
    }
})

module.exports = router