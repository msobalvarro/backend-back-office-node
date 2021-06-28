const {
    getCatalog,
    getUnexpiredInvestents,
    getServerDate,
    insertInterestProcess
} = require("./methods")

/**
 * Run the process to verify investments and insert the interest if is a payday
 * @returns {Promise<void>}
 */
const interestGenerationProcess = async () => {
    const investments = await getUnexpiredInvestents()
    const fecha = await getServerDate()

    if (!Array.isArray(investments)) {
        console.log("No hay investments para realizar proceso de calculo")
        return
    }

    const operaciones = investments.map(invest => {
        return () => insertInterestProcess(invest.investmentId, invest.start_date, invest.amount, invest.months, fecha)
    })

    console.log("Numero de operaciones", operaciones.length)
    Promise.all(
        operaciones.map(promise => promise().catch(err => { return err }))
    ).then(result => {
        console.log(JSON.stringify(result, null, 4))
    })
}

module.exports = {
    interestGenerationProcess
}