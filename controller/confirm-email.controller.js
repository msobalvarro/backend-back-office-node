const sendEmail = require("../configuration/send-email.config")
const { EMAILS } = require("../configuration/constant.config")
const { getHTML } = require("../configuration/html.config")

/**Verificacion de correo de bienvenida */
module.exports = async (name = "", email = "", url = "") => {

    const html = await getHTML("welcome.html", { name, url })

    const config = {
        to: email,
        from: EMAILS.DASHBOARD,
        subject: `Activacion de cuenta Speed Tradings`,
        html: html,
    }

    await sendEmail(config)
}