const { EventEmitter } = require('events')

// import html and sendEmail
const sendEmail = require('../configuration/send-email.config')
const { getHTML } = require('../configuration/html.config')

// import log
const log = require('../logs/write.config')

const MailerEvent = new EventEmitter()

/**
 * Task to render a template and delivery email
 * @param {String} from - email origin
 * @param {String} to - email target
 * @param {String} subject - email subject
 * @param {String} template - filename of template to render
 * @param {Object} data - data needed for render template
 * @param {Array<File>|File} attachments - file list for attach into email
 */
async function sendEmailCallback({
    from,
    to,
    subject,
    template,
    data = {},
    attachments = undefined,
}) {
    try {
        // get html content
        const html = await getHTML(template, data)

        // send email
        await sendEmail({ from, to, subject, html, attachments })
    } catch (error) {
        log(
            `MailerJob: Error on send email to ${to} with subject: ${subject} using template: ${template} | error: ${error}`
        )
    }
}

// config event listener
MailerEvent.on('send', sendEmailCallback)

/**
 * Dispatch mailer job
 * @param {String} from
 * @param {String} to
 * @param {String} subject
 * @param {String} template
 * @param {Object} data
 * @param {Array<File>|File} attachments
 */
module.exports = function (
    from,
    to,
    subject,
    template,
    data = {},
    attachments = undefined
) {
    return new Promise((resolve, reject) => {
        try {
            /**
             * Check required params
             */
            if (!from) {
                throw String('Email from is required')
            }

            if (!to) {
                throw String('Email target is required')
            }

            if (!subject) {
                throw String('Email subject is required')
            }

            if (!template) {
                throw String('Email template is required')
            }

            // dispatch send email task
            MailerEvent.emit('send', {
                from,
                to,
                subject,
                template,
                data,
                attachments,
            })

            resolve(true)
        } catch (error) {
            log(`MailerJob: Error on start job, invalid input data: ${error}`)
            reject(error)
        }
    })
}
