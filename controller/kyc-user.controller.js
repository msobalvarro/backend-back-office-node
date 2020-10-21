const router = require('express').Router()
const moment = require("moment-timezone")

// Write log error
const WriteError = require('../logs/write.config')

// Imports middlewares
const { check, validationResult } = require('express-validator')
const { auth } = require('../middleware/auth.middleware')

// Import Sql config and sql
const sql = require("../configuration/sql.config")
const {
    insertKycUser,
    insertKycUserBeneficiary,
    getKycUserById,
    getKycUserBeneficiaryById
} = require("../configuration/queries.sql")
const { route } = require('./register.controller')
const { Router } = require('express')


// Verificaciones para los parámetros requeridos a la hora de registrar un kyc user
const checkKycUserParams = [
    auth,
    [
        check('birthday', 'Birthday is required').isDate().exists(),
        check('alternativeNumber', 'Alternative number is required').isString().exists(),
        check('nationality', 'Nationality is required').isString().exists(),
        check('phoneCodeNationality', 'Phone code is required').isString().exists(),
        check('currencyNationality', 'Currency is required').isString().exists(),
        check('residence', 'Residence is required').isString().exists(),
        check('phoneCodeResidence', 'Phone code residence is required').isString().exists(),
        check('currencyResidence', 'Currency residence is required').isString().exists(),
        check('province', 'Province is required').isString().exists(),
        check('city', 'City is required').isString().exists(),
        check('direction1', 'Direction 1 is required').isString().exists(),
        check('postalCode', 'Postal code is required').isString().exists(),
        check('profilePictureId', 'Profile picture id is required').isInt().exists()
    ]
]

/**
 * Registrar el kyc de un usuario
 */
router.post('/', checkKycUserParams, async (req, res) => {
    try {
        const { errors } = validationResult(req)

        // Se verifica si existen errores en los parámetros recibidos
        if (errors.length > 0) {
            res.send({
                error: true,
                message: errors[0].msg
            })
        }

        // Datos recibidos
        const { body: data } = req

        // Id de usuario
        const { id_user: idUser } = req.user

        // Parámetros para le procedimiento almacenado del usuario
        const sqlUserParams = [
            idUser,
            data.identificationType || null,
            data.birthday,
            data.identificationNumber || null,
            data.alternativeNumber,
            data.nationality,
            data.phoneCodeNationality,
            data.currencyNationality,
            data.residence,
            data.phoneCodeResidence,
            data.currencyResidence,
            data.province,
            data.city,
            data.direction1,
            data.direction2 || null,
            data.postalCode,
            data.foundsOrigin || null,
            data.estimateMonthlyAmount || null,
            data.profession || null,
            data.profilePictureId,
            data.identificationPictureId || null
        ]

        // Se registra el kyc del usuario
        const result = await sql.run(insertKycUser, sqlUserParams)

        if (!result.length > 0) {
            throw String("error on save kyc user")
        }

        // Obteniendo los datos de beneficiarios, en caso de que existan
        const { beneficiary } = data

        // Si existen los datos del beneficiario, se registran en la BD
        if (beneficiary) {
            // Datos del beneficiario
            const sqlBeneficiaryParams = [
                idUser,
                beneficiary.relationship,
                beneficiary.firstname,
                beneficiary.lastname,
                beneficiary.identificationType,
                beneficiary.birthday,
                beneficiary.identificationNumber,
                beneficiary.principalNumber,
                beneficiary.alternativeNumber,
                beneficiary.nationality,
                beneficiary.phoneCodeNationality,
                beneficiary.currencyNationality,
                beneficiary.residence,
                beneficiary.phoneCodeResidence,
                beneficiary.currencyResidence,
                beneficiary.province,
                beneficiary.city,
                beneficiary.tutor,
                beneficiary.direction1,
                beneficiary.direction2 || null,
                beneficiary.postalCode,
                beneficiary.foundsOrigin,
                beneficiary.estimateMonthlyAmount,
                beneficiary.profession,
                beneficiary.profilePictureId,
                beneficiary.identificationPictureId
            ]

            // Se registra el beneficiario
            const resultBeneficiary = await sql.run(insertKycUserBeneficiary, sqlBeneficiaryParams)

            if (!resultBeneficiary.length > 0) {
                throw String("error on save kyc user beneficiary")
            }
        }

        // enviamos un response
        res.send({ response: "success" })
    } catch (error) {
        WriteError(`kyc-user.controller.js | insert kyc user | ${error.toString()}`)

        res.send({
            error: true,
            message: error.toString()
        })
    }
})


/**
 * Obtener el beneficiario dentro de un kyc de usuario a partir del id_user del mismo
 */
router.get('/', async (req, res) => {
    try {
        // Se obtiene el id de usuario
        const { id_user } = req.user

        // Se solicitan la información del usuario a la BD
        const result = await sql.run(getKycUserById, [id_user])

        // Se verifica que el resultado de la consulta no este vacío
        if (!result.length > 0) {
            throw String("Kyc user not exists")
        }

        // Se almacena el resultado de la consulta inicial
        const response = result[0]

        // Obtiene el beneficiario del usuario, sí este existe
        const resultBeneficiary = await sql.run(getKycUserBeneficiaryById, [id_user])

        if (resultBeneficiary.length > 0) {
            response.beneficiary = resultBeneficiary[0]
        }

        // Se envía la respuesta
        res.send(response)
    } catch (error) {
        WriteError(`kyc-user.controller.js | get kyc user | ${error.toString()}`)

        res.send({
            error: true,
            message: error.toString()
        })
    }
})

module.exports = router