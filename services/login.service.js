
// import constants and functions
const Crypto = require('crypto-js')
const jwt = require('jsonwebtoken')
const { NOW, APP_VERSION } = require("../configuration/constant.config")
const { JWTSECRETSIGN, JWTSECRET } = require("../configuration/vars.config")


// import mysql configuration and sql queries
const sql = require("../configuration/sql.config")
const { login, loginAdmin, insertAdminUser, checkAdminEmail } = require("../configuration/queries.sql")

/**Metodo que genera token */
const SignIn = (playload = {}) => new Promise((resolve, reject) => {
    try {
        // Generate Toke user
        jwt.sign(playload, JWTSECRETSIGN, {}, (errSign, token) => {
            // verificamos si hay un error de token
            if (errSign) {
                throw String(errSign.message)
            }

            resolve(token)
        })
    } catch (error) {
        reject(error)
    }
})

/**
 * @author msobalvarro
 * @param {String} password 
 * @returns {String}
 * @summary funcion que retorna un string encriptado
 */
const passwordEncrypted = password => Crypto.SHA256(password, JWTSECRET).toString()

/**
 * @author msobalvarro
 * @sumary Servicio para ejecutar inicio de sesion
 */
const loginService = {
    // `webLogin` indica si la sesion es de un navegador web
    user: (email, password, web) => new Promise(async (res, rej) => {
        try {
            const results = await sql.run(login, [email, Crypto.SHA256(password, JWTSECRET).toString()])

            // Validamos si existe el usuario
            if (results[0].length === 0) {
                throw String("Correo o Contraseña incorrecta")
            }

            /**Const return data db */
            const result = results[0][0]

            // Verificamos si el usuario ha sido activado
            if (result.enabled === 0) {
                throw String("Esta cuenta no ha sido verificada, revise su correo de activacion")
            }

            // generamos los datos a guardar el token
            const playload = {
                user: result,
                update: NOW(),
                // Se registra, sí el acceso es desde la web
                web,
                // Sí se accede desde la app, se registra el número de versión
                ...(!web) ? { appversion: APP_VERSION } : {}
            }

            // generamos el token
            const token = await SignIn(playload)

            res({ ...result, token })
        } catch (error) {
            rej(error)
        }
    }),

    backOffice: (email, password) => new Promise(async (res, rej) => {
        try {
            const results = await sql.run(loginAdmin, [email, passwordEncrypted(password).toString()])

            // verificamos si el usuario existe
            if (results.length === 0) {
                throw String("Email or password is incorrect")
            }

            /**Const return data db */
            const result = results[0]

            // if (result.)

            // object data send to user admin
            const playload = {
                user: result,
                root: true,
            }

            // Generate Toke user
            jwt.sign(playload, JWTSECRET, {}, (errSign, token) => {
                // verificamos si hay un error al generar el token
                if (errSign) {
                    throw String(errSign)
                }

                /**Concat new token proprerty to data */
                const dataResponse = {
                    id: result.id,
                    name: result.name,
                    email: result.email,
                    token,
                }

                res(dataResponse)
            })
        } catch (error) {
            rej(error)
        }
    }),

    /**Servicio que agrega un usuario para back oficce */
    addAdminUser: (dataForm = { email: "", name: "", password: "" }) => new Promise(async (res, rej) => {
        try {            
            const checkEmail = await sql.run(checkAdminEmail, [dataForm.email])

            // verificamos si existe el correo
            if (checkEmail.length) {
                throw String(`El correo ${dataForm.email} ya esta registrado`)
            }

            // encrypt password
            const password = passwordEncrypted(dataForm.password)

            // mysql insert actions
            await sql.run(insertAdminUser, [dataForm.email, password, dataForm.name])

            res({ success: true, name: dataForm.name, email: dataForm.email, password })
        } catch (error) {
            rej(error)
        }
    })
}

module.exports = loginService