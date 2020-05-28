const log = require('simple-node-logger').createSimpleLogger('./logs/logs.log')

/**Register new message to log archive */
module.exports = (errStr = '', type = 'error') => {
    log.log(type, errStr)
}