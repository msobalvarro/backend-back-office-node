const router = require('express').Router()

// import constant
const log = require("../../logs/write.config")

// sql transacction
const sql = require("../../configuration/sql.config")
const {
    getKycAccountType,
    getKycUserById,
    getKycUserBeneficiaryById,
    getKycEcommerceById,
    getKycEcommerceBeneficiariesById,
    getKycEcommerceLegalRepresentativeById
} = require("../../configuration/queries.sql")


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


module.exports = router