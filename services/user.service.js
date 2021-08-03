const { default: validator } = require('validator')

// import sql configurations
const sql = require("../configuration/sql.config")
const { getUserByEmail } = require("../configuration/queries.sql")

// import constants, functions and services
const { capitalizeFirstLetter } = require("../configuration/constant.config")

const userService = {}

// 1 -> user
// 2 - company

/**
 * @author msobalvarro
 * @summary metodo que obtiene el tipo de cuenta
 */
userService.getKYCType = (id = 1) => {
    switch (id) {
        case 1: return "User"
        case 2: return "Company"
    }
}


/**
 * @author msobalvarro
 * @summary Metodo que devuelve la informacion de un usuario
 * @param {*} email 
 * @returns 
 */
userService.getInfo = (email = "") => new Promise(
    async (resolve, reject) => {
        try {
            if (!validator.isEmail(email)) {
                throw String(`Email is not email :~| (${email})`)
            }

            const dataSQL = await sql.run(getUserByEmail, [email])


            const dataStruct = {
                id: dataSQL[0].id,
                username: dataSQL[0].username,
                type: userService.getKYCType(dataSQL[0].kyc_type),
                state: {
                    enabled: dataSQL[0].enabled === 1,
                    reviewed: dataSQL[0].reviewed === 1
                },
                information: {
                    id: dataSQL[0].id_information,
                    fullName: capitalizeFirstLetter(`${dataSQL[0].firstname} ${dataSQL[0].lastname}`),
                    firstName: capitalizeFirstLetter(dataSQL[0].firstname),
                    lastName: capitalizeFirstLetter(dataSQL[0].lastname),
                },
                contact: {
                    email: dataSQL[0].email.toLowerCase(),
                    phoneNumber: dataSQL[0].phone,
                    country: dataSQL[0].country,
                }
            }

            resolve(dataStruct)
        } catch (error) {
            reject(error)
        }
    }
)

module.exports = userService