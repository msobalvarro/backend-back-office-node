const router = require('express').Router()

// import middlewares
const { check, validationResult } = require('express-validator')

// import constant
const log = require("../../logs/write.config")
const registerAction = require("../../logs/actions/actions.config")

// sql transacction
const sql = require("../../configuration/sql.config")
const {
    getKycAccountType,
    getKycUserById,
    getKycUserBeneficiaryById,
    getKycEcommerceById,
    getKycEcommerceBeneficiariesById,
    getKycEcommerceLegalRepresentativeById,
    verifyKycInformation,
    disableKycInformation
} = require("../../configuration/queries.sql")

// import constants
const { AuthorizationAdmin } = require('../../configuration/constant.config')
const { getHTML } = require("../../configuration/html.config")
const sendEmail = require("../../configuration/send-email.config")


router.get('/:id', async (req, res) => {
    try {
        // Se obtiene el id del usuario
        const { id } = req.params
        // Almacenará la repuesta final que se enviará al cliente
        let response = {}

        // Se obtiene el tipo de kyc
        const resultKycType = await sql.run(getKycAccountType, [id])
        const { kyc_type } = resultKycType[0]

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
        log(`kyc.admin.controller.js | Error al obtener kyc del usuario | ${message.toString()}`)

        res.send({
            error: true,
            message
        })
    }
})


const checkDisableKycParams = [
    check('fullname', 'Name is required').exists(),
    check('email', 'Email id required').exists().isEmail(),
    check('password', 'Admin Password id required').exists(),
    check('reason', 'Disable kyc reason is required').exists().isString()
]

/**
 * Deshabilita el registro kyc de un usuario
 */
router.post('/:id/disable', checkDisableKycParams, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Se obtiene el id del usuario
        const { id } = req.params
        // Se extrae la contraseña del root admin
        const { fullname, email, password, reason } = req.body

        // Autenticamos al root admin
        await AuthorizationAdmin(password)

        // Se obtiene el tipo de kyc
        const resultKycType = await sql.run(getKycAccountType, [id])
        const { kyc_type } = resultKycType[0]

        if (kyc_type === null) {
            throw String('The current kyc not exist')
        }

        await sql.run(disableKycInformation, [id, kyc_type])

        // Datos a renderizar dentro de la plantilla de correo
        const htmlData = {
            name: fullname,
            reason
        }

        const html = await getHTML('disable-kyc.html', htmlData)

        // Se envía el correo de notificación
        await sendEmail({
            from: 'gerencia@alysystem.com',
            to: email,
            subject: 'Cuenta Deshabilitada Temporalmente',
            html
        })

        // Registramos la accion
        registerAction({ name: req.user.name, action: `Ha Desabilitado el registro KYC de ${fullname}` })

        res.send({ response: "success" })
    } catch (message) {
        console.log(message)
        log(`kyc.admin.controller.js | Error al deshabilitar kyc del usuario | ${message.toString()}`)

        res.send({
            error: true,
            message
        })
    }
})


/**
 * Establece como verificado un registro de kyc
 */
router.get('/:id/verify', async (req, res) => {
    try {
        // Se obtiene el id del usuario
        const { id } = req.params

        // Se establece la verificación del registro kyc
        await sql.run(verifyKycInformation, [id])

        // registramos la accion
        registerAction({ name: req.user.name, action: `Ha Verificado registro KYC [ID: ${id}]` })

        res.send({ response: 'success' })
    } catch (message) {
        log(`kyc.admin.controller.js | Error al verificar kyc | ${message.toString()}`)

        res.send({
            error: true,
            message
        })
    }
})


module.exports = router