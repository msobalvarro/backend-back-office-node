const { getHTML } = require('../../configuration/html.config')
const sendEmail = require('../../configuration/send-email.config')
const moment = require('moment')
const { EMAILS } = require('../../configuration/constant.config')
const sendVerficationEmail = async ({
    ip, host, username, firstname, email
}) => {
    
    // obtenemos los datos para enviar el correo
    const dataEmailConfirm = { time: moment(), username, ip }

    // creamos el url encriptado
    const base64 = Buffer.from(JSON.stringify(dataEmailConfirm)).toString(
        'base64'
    )

    // WARNING!!! CHANGE HTTP TO HTTPS IN PRODUCTION
    // const registrationUrl = 'http://ardent-medley-272823.appspot.com/verifyAccount?id=' + base64;
    const registrationUrl = `https://${host}/verifyAccount?id=${base64}`

    // obtenemos la plantilla de bienvenida
    const html = await getHTML('welcome.html', {
        name: firstname,
        url: registrationUrl,
    })

    // enviamos el correo de activacion
    await sendEmail({
        from: EMAILS.DASHBOARD,
        to: email,
        subject: 'Activación de Cuenta',
        html,
    })

}
module.exports = {
    sendVerficationEmail
}