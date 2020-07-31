const sgMail = require('@sendgrid/mail')

const { SENDGRID_API_KEY } = require("./vars.config")

/**
 * Metodo para envio de correo generico
 * 
 * @param {Object} config
 */
const sendEmail = (config = { from: "", to: "", subject: "", html: "", }) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    return new Promise(async (resolve, reject) => {
        await sgMail.send(config)
            .catch(reason => reject(reason))
            .then(response => resolve(response))
    })
}

module.exports = sendEmail