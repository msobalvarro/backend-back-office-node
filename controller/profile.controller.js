const express = require('express')
const router = express.Router()

// import constants and funcitons
const Crypto = require('crypto-js')
const WriteError = require('../logs/write.config')

// import middlewares
const { check, validationResult } = require('express-validator')
const { auth } = require('../middleware/auth.middleware')

// Imports mysql config
const {
    login,
    getInfoProfile,
    updateWalletAlyPay,
    getUserAvatarPictureId,
    getKycUserById,
    getKycUserBeneficiaryById,
    getKycEcommerceById,
    getKycEcommerceBeneficiariesById,
    getKycEcommerceLegalRepresentativeById,
} = require('../configuration/queries.sql')
const sql = require('../configuration/sql.config')

// enviroment
const { JWTSECRET } = require('../configuration/vars.config')

// import services
const { AlypayService } = require('../services')

router.post('/update-photo', auth, (_, res) => {
    try {
    } catch (error) {
        /**Error information */
        WriteError(`profile.js - error al actualizar foto | ${error}`)

        const response = {
            error: true,
            message: error,
        }

        res.send(response)
    }
})

const checkValidation = [
    auth,
    [
        check('id_user', 'id_user is required').exists().isInt(),
        check('btc', 'Wallet en BTC es requerido').exists(),
        check('eth', 'Wallet en ETH es requerido').exists(),
        check('password', 'password is required').exists(),
        check('email', 'email is requerid').exists(),
    ],
]

// controlador para actualizar direcciones wallets
router.post('/update-wallet', checkValidation, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        const { id_user } = req.user

        const {
            btc,
            eth,
            /* aly_btc,
            aly_eth, */
            password,
            email,
        } = req.body

        const results = await sql.run(login, [
            email,
            Crypto.SHA256(password, JWTSECRET).toString(),
        ])

        if (results[0].length === 0) {
            throw String('Tu contraseña es incorrecta')
        }

        // actualizamos la wallets de speedTradings
        //await sql.run(updateWallets, [btc, eth, id_user])

        const wallet_btc = btc.trim()
        const wallet_eth = eth.trim()

        // Se verifica que las wallets ingresadas sean de alypay
        await AlypayService.verifyWallet(
            { wallet: wallet_btc, symbol: 'BTC', coinName: 'Bitcoin' },
            { wallet: wallet_eth, symbol: 'ETH', coinName: 'Ethereum' }
        )

        const paramsAlyWallet = [
            // se añaden las wallets de alypay
            wallet_btc.trim(),
            wallet_eth.trim(),
            // se indica que e usuario recibirá pagos por alypay
            1,
            id_user,
        ]

        // verificamos si el usuario quire recibir pagos en alypay
        // 1 - Recibir pagos
        // 0 - no recibir pagos pero si guardar mi wallet
        //paramsAlyWallet.push(payWithAlypay === true ? 1 : 0)

        // ejecutamos consulta de actualizacion
        await sql.run(updateWalletAlyPay, paramsAlyWallet)

        // obtenemos el token
        const token = req.header('x-auth-token')

        /**Const return data db */
        const result = Object.assign(results[0][0], { token })

        res.send(result)
    } catch (error) {
        /**Error information */
        WriteError(`profile.js - error al actualizar wallet | ${error}`)

        const response = {
            error: true,
            message: error,
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
                avatar: resultAvatar.length > 0 ? resultAvatar[0].id : null,
            })
        } else {
            throw String('El parametro ID es requerido')
        }
    } catch (error) {
        WriteError(
            `profile.controller.js - Error al obtener el perfil del usuario | ${error}`
        )

        res.send({
            error: true,
            message: error.toString(),
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
            const resultInformationKycUserBeneficiary = await sql.run(
                getKycUserBeneficiaryById,
                [id]
            )

            // Se construye el objeto de respuesta
            response = {
                ...resultInformationKycUser[0],
                beneficiary: resultInformationKycUserBeneficiary[0],
            }
        }

        // Si el kyc es de una empresa
        if (kyc_type === 2) {
            // Obtiene la información general del comercio
            const resultInformationKycEcommerce = await sql.run(
                getKycEcommerceById,
                [id]
            )

            // Obtiene la información de los beneficiarios
            const resultInformationKycEcommerceBeneficiaries = await sql.run(
                getKycEcommerceBeneficiariesById,
                [id]
            )

            // Obtiene la información del representante legal
            const resultInformationKycEcommerceLegalRepresentative = await sql.run(
                getKycEcommerceLegalRepresentativeById,
                [id]
            )

            // Se contruye el objeto de respuesta
            response = {
                ...resultInformationKycEcommerce[0],
                legalRepresentative:
                    resultInformationKycEcommerceLegalRepresentative[0],
                ...(resultInformationKycEcommerceBeneficiaries.length > 0
                    ? {
                        beneficiaries: resultInformationKycEcommerceBeneficiaries,
                    }
                    : {}),
            }
        }

        // Se envía le respuesta obtenida
        res.send(response)
    } catch (message) {
        WriteError(
            `profile.controller.js | Error al obtener kyc del usuario | ${message.toString()}`
        )

        res.send({
            error: true,
            message,
        })
    }
})

module.exports = router
