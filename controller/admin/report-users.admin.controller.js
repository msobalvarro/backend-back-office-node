const router = require('express').Router()
const moment = require('moment')
require('moment/locale/es')

// import middleware
const { check, validationResult } = require('express-validator')

// import constants
const log = require('../../logs/write.config')
const registerAction = require('../../logs/actions/actions.config')
const {
    socketAdmin,
    eventSocketNames,
    AuthorizationAdmin,
    breakTime,
} = require('../../configuration/constant.config')

// import sql
const sql = require('../../configuration/sql.config')
const {
    getReportUserDeliveryListByEmail,
} = require('../../configuration/queries.sql')

// import services
const { ReportUserService } = require('../../services')

// import jobs
const { MailerJob: Mailer } = require('../../jobs')

const checkParams = [
    check('id', 'Id user is required').isNumeric().exists(),
    check('date', 'Date Report is required').exists(),
]

/**
 * Controlador para obtener los datos para generar el estado de cuenta de las inversione
 * de un cliente
 */
router.post('/', checkParams, async (req, res) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Se extraen los datos necesarios para generar el reporte
        const { id, date } = req.body

        const result = await ReportUserService.getReportUserData(id, date)

        if (result.error) {
            throw String(result.message)
        }

        res.send(result)
    } catch (message) {
        log(
            `report-users.admin.controller.js | Error al generar reporte estado de cuenta de usuario | ${message.toString()}`
        )

        res.send({
            error: true,
            message,
        })
    }
})

const checkDeliveryParams = [
    check('date', 'Date Report is required').exists(),
    check('password', 'Password Authorization is required').exists(),
]

/**
 * Envía por correo los reportes de estado de cuenta a todos los usuarios
 * con planes activos
 */
router.post('/delivery', checkDeliveryParams, async (req, res) => {
    try {
        // Se verifica sí hay errores en los parámetros recibidos
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Obtiene la fecha del reporte
        const { date, password } = req.body
        let index = 0

        // Autenticamos al root admin
        await AuthorizationAdmin(password)

        // enviamos el evento que activa la modal
        socketAdmin.emit(eventSocketNames.onTogglePercentage, true)

        // Obtiene la lista de los usuarios a los que se enviarán los reportes
        const deliveryList = await ReportUserService.getDeliveryList(date)

        for (let user of deliveryList) {
            // Se obtiene los datos del usuario actual
            const { id, email, fullname, btc, eth } = user

            // Se obtiene el porcentage de progreso
            const currentPercentageValue = (
                ((index + 1) / deliveryList.length) *
                100
            ).toFixed(2)

            console.log(
                'current report: ',
                fullname,
                ' => %',
                currentPercentageValue
            )

            // enviamos por socket el porcentaje de los reportes enviados
            socketAdmin.emit(eventSocketNames.setPercentageCharge, {
                currentPercentageValue,
                name: fullname,
                title: 'Enviando Estados de Cuenta',
            })

            index++

            // Sí no posee planes activos, se pasa al siguiente usuario
            if (btc === 0 && eth === 0) {
                continue
            }

            // Se obtienen los datos del usuario para el reporte
            ReportUserService.getReportUserData(id, date).then(result => {
                if (result.error) {
                    log(
                        `report-users.admin.controller.js | Error al generar reporte estado de cuenta del mes ${date} al usuario: ${fullname} | ${result.message}`
                    )
                    return
                }

                // Se generan los pdf de los reportes
                ReportUserService.generateReportUserPdf({
                    ...result,
                    btc,
                    eth,
                    fullname,
                    date,
                })
                    .then(attachments => {
                        const _date = `${moment(date).format(
                            'MMMM'
                        )} de ${moment(date).format('YYYY')}`

                        // Se envía la notificación del reporte y se adjuntan los archivos generados
                        Mailer(
                            'gerencia@alysystem.com',
                            email,
                            'Estados de cuenta',
                            'user-report.html',
                            {
                                name: fullname,
                                date: _date,
                            },
                            attachments
                        )
                    })
                    .catch(error =>
                        log(
                            `report-users.admin.controller.js | Error al enviar reporte estado de cuenta del mes ${date} al usuario: ${fullname} | ${error}`
                        )
                    )
            })

            await breakTime(5000)
        }

        console.log('finished report delivery')

        // Registramos la accion
        registerAction({ name: req.user.name, action: `Ha enviado todos los reportes de estado de cuenta` })

        res.send({ response: 'success' })
    } catch (message) {
        log(
            `report-users.admin.controller.js | Error al enviar los reporte estado de cuenta de usuario | ${message.toString()}`
        )

        res.send({
            error: true,
            message,
        })
    } finally {
        // enviamos el evento que oculta la modal
        socketAdmin.emit(eventSocketNames.onTogglePercentage, false)
    }
})

const checkDeliveryUserParams = [
    check('email', 'Email user is required').exists(),
    check('date', 'Date Report is required').exists(),
    check('password', 'Password Authorization is required').exists(),
]

router.post('/delivery/user', checkDeliveryUserParams, async (req, res) => {
    try {
        // Se verifica sí hay errores en los parámetros recibidos
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            throw String(errors.array()[0].msg)
        }

        // Se extrae la fecha del reporte y el correo del usuario
        const { email, date, password } = req.body

        // Autenticamos al root admin
        await AuthorizationAdmin(password)

        const response = await sql.run(getReportUserDeliveryListByEmail, [
            `${moment(date).endOf('month').format('YYYY-MM-DD')} 23:59:59`,
            email,
        ])

        if (response.length === 0) {
            throw String(
                'Error al generar el reporte. No se encontró el usuario en la fecha indicada'
            )
        }

        const { id, fullname, btc, eth } = response[0]

        // Sí no posee planes activos, se pasa al siguiente usuario
        if (btc === 0 && eth === 0) {
            throw String(
                'Error al generar el reporte, El usuario no posee ningún plan'
            )
        }

        ReportUserService.getReportUserData(id, date).then(result => {
            if (result.error) {
                return
            }

            ReportUserService.generateReportUserPdf({
                ...result,
                btc,
                eth,
                fullname,
                date,
            }).then(attachments => {
                const _date = `${moment(date).format('MMMM')} de ${momen(
                    date
                ).format('YYYY')}`

                // Se envía la notificación del reporte y se adjuntan los archivos generados
                Mailer(
                    'gerencia@alysystem.com',
                    email,
                    'Estados de cuenta',
                    'user-report.html',
                    {
                        name: fullname,
                        date: _date,
                    },
                    attachments
                )
            })
        })

        // Registramos la accion
        registerAction({ name: req.user.name, action: `Ha enviado el reportes de estado de cuenta a ${fullname} [EMAIL: ${email}]` })

        res.send({
            response: 'success',
        })
    } catch (message) {
        res.send({
            error: true,
            message,
        })
    }
})

module.exports = router
