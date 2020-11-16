const router = require('express').Router()
const Crypto = require('crypto-js')

// Write log error
const WriteError = require('../logs/write.config')

// Imports middlewares
const { check, validationResult } = require('express-validator')

// Import Sql config and sql
const sql = require("../configuration/sql.config")

// enviroment
const { JWTSECRET } = require("../configuration/vars.config")

const {
    login,
    insertKycUser,
    insertKycUserBeneficiary,
    registerKycAccountType,
    getKycUserById,
    getKycUserBeneficiaryById
} = require("../configuration/queries.sql")
const { before } = require('lodash')


// Verificaciones para los parámetros requeridos a la hora de registrar un kyc user
const checkKycUserParams = [
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
            const resultBeneficiary = await saveBeneficiary(idUser, beneficiary)

            if (resultBeneficiary.error) {
                throw String(resultBeneficiary.message)
            }
        }

        // Registra el tipo de kyc que está registrando el usario
        const resultKycType = await sql.run(registerKycAccountType, [idUser, 1])

        if (!resultKycType.length > 0) {
            throw String("error on register kyc type")
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


// Verificaciones para los parámetros requeridos a la hora de registrar un kyc user beneficiary
const checkKycUserBeneficiaryParams = [
    [
        check('email', 'Email Beneficiary is required').isEmail().exists(),
        check('identificationType', 'Identification Type is required').exists(),
        check('fisrtname', 'Firstname is required').exists(),
        check('lastname', 'Lastname is required').exists(),
        check('identificationNumber', 'Identification Number is required').exists(),
        check('principalNumber', 'Principal Number is required').exists(),
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
        check('profilePictureId', 'Profile picture id is required').isInt().exists(),
        check('tutor', 'Tutor is required').exists(),
        check('foundsOrigin', 'Founds Origin is required').exists(),
        check('estimateMonthlyAmount', 'Estimate Monthly Amount is required').exists(),
        check('profession', 'Profession is required').exists(),
        check('passwordUser', 'Password user is required').exists(),
        check('emailUser', 'Email user is required').exists()
    ]
]

/**
 * Endpoint para guardar un beneficiario por sí solo
 */
router.post('/beneficiary', checkKycUserBeneficiaryParams, async (req, res) => {
    try {
        // id del usario
        const { id_user: idUser } = req.user
        // Credenciales para verificar que haya sido el usuario el que realizó la petición
        const { passwordUser, emailUser } = req.body
        // Campos del beneficiario
        const beneficiary = req.body

        const resultLogin = await sql.run(login, [emailUser, Crypto.SHA256(passwordUser, JWTSECRET).toString()])

        if (resultLogin[0].length > 0) {
            // Se alamacena el beneficiario
            const result = await saveBeneficiary(idUser, beneficiary)

            if (result.error) {
                throw String(result.message)
            }

            res.send({ response: "success" })
        } else {
            throw String("Tu contraseña es incorrecta")
        }
    } catch (error) {
        WriteError(`kyc-user.controller.js | save kyc beneficiary | ${error.toString()}`)

        res.send({
            error: true,
            message: error.toString()
        })
    }
})

/**
 * Endpoint para obtener el beneficiario asociado al usuario que realiza la petición
 */
router.get('/beneficiary', async (req, res) => {
    try {
        // id del usuario
        const { id_user: idUser } = req.user

        const result = await sql.run(getKycUserBeneficiaryById, [idUser])

        // Se verifica que el resultado de la consulta no este vacío
        if (!result.length > 0) {
            res.send({})
        }

        // se envía la respuesta
        res.send(result[0])
    } catch (error) {
        WriteError(`kyc-user.controller.js | get kyc beneficiary | ${error.toString()}`)

        res.send({
            error: true,
            message: error.toString()
        })
    }
})


/**
 * Función para registar un beneficiario de usuario
 */
const saveBeneficiary = (idUser, beneficiary) => new Promise(async (resolve, _) => {
    try {
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
            beneficiary.identificationPictureId,
            beneficiary.email
        ]

        // Se registra el beneficiario
        const resultBeneficiary = await sql.run(insertKycUserBeneficiary, sqlBeneficiaryParams)

        if (!resultBeneficiary.length > 0) {
            throw String("error on save kyc user beneficiary")
        }

        resolve({ success: true })
    } catch (error) {
        resolve({
            error: true,
            message: error.toString()
        })
    }
})

module.exports = router