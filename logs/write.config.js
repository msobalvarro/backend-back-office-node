const log = require('simple-node-logger').createSimpleLogger({
    logFilePath: './logs/logs.log',
    timestampFormat: '(DD-MM-YYYY HH:mm:ss)'
})

/**Register new message to log archive */
module.exports = (errStr = '', type = 'error') => {
    log.log(type, errStr)
}