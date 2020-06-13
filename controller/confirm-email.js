const sendEmail = require("../config/sendEmail")
const { EMAILS } = require("../config/constant")
const { getHTML } = require("../config/html")

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