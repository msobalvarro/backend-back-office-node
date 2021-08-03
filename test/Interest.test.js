const moment = require("moment")
const { getUnexpiredInvestents, getServerDate, insertInterestProcess } = require("../alytrade/cronjob/methods")

describe('Prueba de generacion de intereses',()=>{
    test('Proceso de Generacion de intereses',async (done)=>{
        const investments = await getUnexpiredInvestents()
        const fecha = moment('2021-08-09').toDate()//await getServerDate()

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
        }).finally(()=> done())
        console.log(fecha)
    },50000)
})