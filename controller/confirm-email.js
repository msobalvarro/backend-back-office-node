const sgMail = require('@sendgrid/mail')

if (process.env.NODE_ENV !== 'production') require('dotenv').config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

/**Verificacion de correo de bienvenida */
module.exports = async (name = "", email = "", url = "") => {
    const msg = {
        to: email,
        from: 'dashboard@speedtradings.com',
        subject: `Activacion de cuenta Speed Tradings`,
        html: `
        <div
            style="background: linear-gradient(238deg, rgba(0, 0, 0, 1) 0%, rgba(25, 24, 24, 1) 52%, rgba(21, 61, 70, 1) 100%); padding: 25px; color: #ffffff; font-size: 1.2em; font-family: Arial, Helvetica, sans-serif; text-align: center; height: 100%;">
            <a href="https://www.speedtradings.com/">
                <img width="512" height="256"
                    src="https://lh3.googleusercontent.com/XtcodcoWRFK2wQXbDEv6q6RJ26lHZHuSBEn3yBkpzh2dmuWZc546Mm128xdoTjtFIEWUVFp2DjFSB4Bfz44wSfD17QqpogYvq8UBRHtLWb9DZuD9qziilG_J8pEOwigJKfM85zLmWZKR825axHJuR49JD_Q499xq7bgc_2-UjiQI97OdFh-pGgN8jbhmepRHhUmazh_WC3BuZBcw70VSpJGDOBd8Qbqtl0jyDWcT-yUTl3chpl45DmHEwhB0F3updv61LRm96Vz9GRD1EM3ftmzKbAET_M3SON_5QNinYlMH20oqJsmvQ-wBlXiLoDssrlKu-QgvfVaYdQD4l4_9pnqOUzqeRzpIwEMbPMq21MS96ySQVottkdT2aV5ViqOXKvCGhgi0rcBMgEhdhOO7N7X467ohDH26hLgL7gv9XV-VhClkv4X5zn1ykbda2Mpx7ZrwG3LroS3Qxb1xt7J3YyS5uA_7VXoUIlmRW1tijC-itvyVyS5BK4skiazCJIedvWbEFEes1IoGw3BW0YHv6LjC-peUV7CiB2Fib4b79qwxrIdGYOv4UN9dHYHCV4QHaEFe4wb8NMRpTrbO8Et-5vn7mxL2aQn7IziZr-3hra2E5CboMxYrYhMTiXAnEmMTFr3Q4G3ywafX96q4qBIQlF8PHhs6cDciS4NHMKu1CMqOX9c3n66WlLapannN0j02aYF-NA=w1600-h828-ft" />
            </a>

            <br />

            <h1>Hola ${name}</h1>

            <h2>Te damos la bienvenida a <b>Speed Tradings Bank</b></h2>

            <div style="padding: 25px; background-color: rgba(255, 255, 255, 0.2); margin-top: 10px; border-radius: 10px;">
                <p>
                    Para continuar debera de <a style="color: #9ed3da" href="${url}">hacer Click aqui para confirmar tu cuenta</a>
                </p>
            </div>

            <br />

            <b style="color: #ffcb08; font-size: 14px;">Saludos, Equipo de Speed Tradings Bank.</b>
        </div>
        `,
    }

    await sgMail.send(msg).catch(err => new Error(err))
}