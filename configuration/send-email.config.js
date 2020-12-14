const nodemailer = require('nodemailer')
const mailgun = require('nodemailer-mailgun-transport')
const log = require("../logs/write.config")
const { MAILGUN_APIKEY, MAILGUN_DOMAIN } = require("./vars.config")

// creamos el transprt
const transporter = nodemailer.createTransport(mailgun({
    auth: {
        api_key: MAILGUN_APIKEY,
        domain: MAILGUN_DOMAIN
    }
}))

/**
 * Metodo para envio de correo generico
 * 
 * @param {Object} config
 */
const sendEmail = (config = {
    from: "",
    to: "",
    subject: "",
    html: "",
    attachments
}) => new Promise(async (resolve, reject) => {
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
