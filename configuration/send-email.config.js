const nodemailer = require('nodemailer')
const log = require("../logs/write.config")
const { EMAILACCOUNT, EMAILPASSWORD } = require("./vars.config")

// creamos el transprt
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    pool: true,
    auth: {
        user: EMAILACCOUNT,
        pass: EMAILPASSWORD
    }
})

/**
 * Metodo para envio de correo generico
 * 
 * @param {Object} config
 */
const sendEmail = (config = { from: "", to: "", subject: "", html: "", }) => new Promise(async (resolve, reject) => {
    try {
        transporter.sendMail(config, (err, info) => {
            if (err) {
                reject(err.message)
            }

            resolve(info)
        })
    } catch (error) {
        log(`send-email.config.js | ${error}`)

        reject(error)
    }

})

module.exports = sendEmail
