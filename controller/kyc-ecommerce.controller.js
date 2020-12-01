const router = require('express').Router()

// Write log error
const WriteError = require('../logs/write.config')

// Imports middlewares
const { check, validationResult } = require('express-validator')

// Import Sql config and sql
const sql = require("../configuration/sql.config")

const {
    insertKycEcommerce,
    insertKycEcommerceBeneficiary,
    insertKycEcommerceLegalRepresentative,
    insertKycEcommerceTradeIncomming,
    registerKycAccountType
} = require("../configuration/queries.sql")


const checkKycEcommerceParams = [
    check('comercialCountry', 'Comercial Country is required').exists(),
    check('comercialPhoneCode', 'Comercial Phone Code is required').exists(),
    check('comercialCurrency', 'Comercial Currency is required').exists(),
    check('comercialProvince', 'Comercial Province is required').exists(),
    check('permanentCountry', 'Permanent Country is required').exists(),
    check('permanentPhoneCode', 'Permanent Phone Code is required').exists(),
    check('permanentCurrency', 'Permanent Currency is required').exists(),
    check('permanentProvince', 'Permanent Province is required').exists(),
    check('commerceName', 'Commerce Name is required').exists(),
    check('commerceType', 'Commerce Type is required').exists(),
    check('commerceIdentificationNumber', 'Commerce Identification Number is required').exists(),
    check('commerceIdentificationPicture', 'Commerce Identification Picture is required').exists(),
    check('incorporationDate', 'Incorporation Date is required').exists(),
    check('commerceCity', 'Commerce City is required').exists(),
    check('commerceDirection', 'Commerce Direction is required').exists(),
    check('commercePostalCode', 'Commerce Postal Code is required').exists(),
    check('beneficiaries', 'Beneficiaries List is required').isArray({ min: 1 }),
    check('legalRepresentative', 'Legal Representative Info is required').exists(),
    check('commerceNote', 'Commerce Note is required').exists(),
    check('commerceEstimateTransactions', 'Commerce Estimate Transactions is required').exists(),
    check('commerceEstimateTransactionsAmount', 'Commerce Estimate Transacctions Amount').exists(),
    check('commerceCertificatePicture', 'Commerce Certificate Picture is required').exists(),
    check('commerceDirectorsPicture', 'Commerce Directors Picture').exists(),
    check('commerceDirectorsInfoPicture', 'Commerce Directors Info is required').exists(),
    check('commerceLegalCertificate', 'Commerce Legal Certificate is required').exists()
]

// Función para verificar que se hayan enviado los parámetros requeridos del beneficiario
const checkKycEcommerceBeneficiaryParams = _beneficiary => {
    const _keys = Object.keys(_beneficiary)
    const errors = []
    const _beneficiaryRequieredParams = [
        'chargeTitle',
        'fullname',
        'birthday',
        'originCountry',
        'originPhoneCode',
        'originCurrency',
        'province',
        'city',
        'direction',
        'postalCode',
        'participationPercentage',
        'email'
    ]

    for (let _keyItem of _beneficiaryRequieredParams) {
        if (_keys.indexOf(_keyItem) === -1) {
            errors.push(`Ecommerce Beneficiary: ${_keyItem} is required`)
        }
    }

    return errors
}

// Función para verificar que se hayan enviado los parámetros del representante legal
const checkKycEcommerceLegalRepresentativeParams = _legalRepresentative => {
    const _keys = Object.keys(_legalRepresentative)
    const errors = []
    const _legalRepresentativeRequiredParams = [
        'representativeType',
        'chargeTitle',
        'fullname',
        'originCountry',
        'originPhoneCode',
        'originCurrency',
        'direction',
        'telephoneNumber',
        'passportPicture',
        'identificationPicture',
        'politicallyExposed',
        'email'
    ]

    for (let _keyItem of _legalRepresentativeRequiredParams) {
        if (_keys.indexOf(_keyItem) === -1) {
            errors.push(`Ecommerce Legal Representative: ${_keyItem} is required`)
        }
    }

    return errors
}

router.post('/', checkKycEcommerceParams, async (req, res) => {
    try {
        const { errors } = validationResult(req)

        // Se verifica si existen errores en los parámetros recibidos
        if (errors.length > 0) {
            throw String(errors[0].msg)
        }

        // Id de usuario
        const { id_user: idUser } = req.user
        // Datos recibidos
        const { body: data } = req
        // Se extraen los beneficiarios y la información del representante legal
        const { beneficiaries, legalRepresentative } = data
        console.log(data)

        // Se verfica si hay errores en los parámetros de los beneficiarios
        for (let beneficiary of beneficiaries) {
            const _errors = checkKycEcommerceBeneficiaryParams(beneficiary)

            if (_errors.length > 0) {
                throw String(_errors[0])
            }
        }

        // Se verifica si hay errores en los parámetros del representante legal
        const _errors = checkKycEcommerceLegalRepresentativeParams(legalRepresentative)

        if (_errors.length > 0) {
            throw String(_errors[0])
        }

        // Parámetros para el proc de inserción de kycEcommerce
        const sqlEcommerceParams = [
            idUser,
            data.commerceWebsite || null,
            data.comercialCountry,
            data.comercialPhoneCode,
            data.comercialCurrency,
            data.comercialProvince,
            data.permanentCountry,
            data.permanentPhoneCode,
            data.permanentCurrency,
            data.permanentProvince,
            data.commerceName,
            data.commerceType,
            data.commerceTelephone,
            data.commerceIdentificationNumber,
            data.commerceIdentificationPicture,
            data.incorporationDate,
            data.commerceCity,
            data.commerceDirection,
            data.commerceDirection2 || null,
            data.commercePostalCode
        ]

        // Se registran los datos del kyc de comercio
        await sql.run(insertKycEcommerce, sqlEcommerceParams)

        // Se recorre cada beneficiario de la lista y se registra en la BD
        for (let beneficiary of beneficiaries) {
            const beneficiaryResult = await saveEcommerceBeneficiary(idUser, beneficiary)

            if (beneficiaryResult.error) {
                throw String(beneficiaryResult.message)
            }
        }

        // Se almacena la información del representante legal
        const resultRepresentativeLegal = await saveEcommerceLegalRepresentative(idUser, legalRepresentative)

        if (resultRepresentativeLegal.error) {
            throw String(resultRepresentativeLegal.message)
        }


        // Parámetros para almacenar la información de la última sección del formulario
        const sqlEcommerceTradeIncommingParams = [
            idUser,
            data.commerceNote,
            data.commerceEstimateTransactions,
            data.commerceEstimateTransactionsAmount,
            data.commerceCertificatePicture,
            data.commerceDirectorsPicture,
            data.commerceDirectorsInfoPicture,
            data.commerceLegalCertificate
        ]

        // Se regista la información de transacciones y certificados de verificación
        await sql.run(insertKycEcommerceTradeIncomming, sqlEcommerceTradeIncommingParams)

        // Se actualiza el tipo de cuenta que posee el usuario
        await sql.run(registerKycAccountType, [idUser, 2])

        res.send({ success: true })
    } catch (error) {
        WriteError(`kyc-ecommerce.controller.js | insert kyc ecommerce | ${error.toString()}`)

        res.send({
            error: true,
            message: error.toString()
        })
    }
})


/**
 * Función para registar un beneficiario de comercio
 * @param {Number} idUser - id del usuario
 * @param {Object} beneficiaryData - Información del beneficiario
 */
const saveEcommerceBeneficiary = (idUser, beneficiaryData) => new Promise(async (resolve, reject) => {
    try {
        // Datos del beneficiario
        const sqlEcommerceBeneficiaryParams = [
            idUser,
            beneficiaryData.chargeTitle,
            beneficiaryData.fullname,
            beneficiaryData.birthday,
            beneficiaryData.identificationNumber || null,
            beneficiaryData.passportNumber || null,
            beneficiaryData.passportCountry || null,
            beneficiaryData.passportPhoneCode || null,
            beneficiaryData.passportCurrency || null,
            beneficiaryData.originCountry,
            beneficiaryData.originPhoneCode,
            beneficiaryData.originCurrency,
            beneficiaryData.province,
            beneficiaryData.city,
            beneficiaryData.direction,
            beneficiaryData.postalCode,
            beneficiaryData.participationPercentage,
            beneficiaryData.identificationTaxNumber || null,
            beneficiaryData.passportPicture,
            beneficiaryData.identificationPicture,
            beneficiaryData.email
        ]

        // Se ejecuta el procedimiento almacenado
        await sql.run(insertKycEcommerceBeneficiary, sqlEcommerceBeneficiaryParams)

        resolve({ success: true })
    } catch (error) {
        resolve({
            error: true,
            message: error.toString()
        })
    }
})


/**
 * Función para registar un representante legal de comercio
 * @param {Number} idUser - id del usuario
 * @param {Object} legalRepresentativeData - Información del representante legal
 */
const saveEcommerceLegalRepresentative = (idUser, legalRepresentativeData) => new Promise(async (resolve, _) => {
    try {
        // Paŕametros para el registro del representante legal
        const sqlEcommerceLegalRepresentativeParams = [
            legalRepresentativeData.representativeType,
            idUser,
            legalRepresentativeData.chargeTitle,
            legalRepresentativeData.fullname,
            legalRepresentativeData.identificationNumber || null,
            legalRepresentativeData.passportNumber || null,
            legalRepresentativeData.passportCountry || null,
            legalRepresentativeData.passportPhoneCode || null,
            legalRepresentativeData.passportCurrency || null,
            legalRepresentativeData.originCountry,
            legalRepresentativeData.originPhoneCode,
            legalRepresentativeData.originCurrency,
            legalRepresentativeData.direction,
            legalRepresentativeData.identificationTaxNumber || null,
            legalRepresentativeData.telephoneNumber,
            legalRepresentativeData.passportPicture,
            legalRepresentativeData.identificationPicture,
            legalRepresentativeData.politicallyExposed,
            legalRepresentativeData.email
        ]

        // Se registra la información del representante legal
        await sql.run(insertKycEcommerceLegalRepresentative, sqlEcommerceLegalRepresentativeParams)


        resolve({ success: true })
    } catch (error) {
        resolve({
            error: true,
            message: error.toString()
        })
    }
})


module.exports = router