const { log } = require('simple-node-logger').createSimpleLogger({
    logFilePath: './logs/actions/actions.log',
    timestampFormat: 'DD-MM-YYYY HH:mm'
})

/**Register new message to log archive */
module.exports = (e = { name: "", action: "" }) => {
    log("info", `[${e.name}] - ${e.name}`)
}