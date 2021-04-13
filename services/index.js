const { mode } = require('crypto-js')
const ReportUserService = require('./report-user.service')
const ReportUserPdfService = require('./user-report-pdf.service')

module.exports = {
    ReportUserService,
    ReportUserPdfService,
}
