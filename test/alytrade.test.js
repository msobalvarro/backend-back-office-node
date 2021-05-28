const faker = require('faker')
const Crypto = require('crypto-js')
const queries = require('../controller/alytrade/sql')
const sql = require('../configuration/sql.config')
const moment = require('moment')
const {
    getCatalog,
    getUnexpiredInvestents,
    generatePayDays,
    insertInterestProcess
} = require('../controller/alytrade/cronjob/methods')

test.skip("Alytrade | Ingreso de usuario de Alytrade", async () => {
    const username = faker.internet.userName()
    const password = faker.internet.password(6, true)

    const paramsRegister = [
        faker.name.findName(), //firstname,
        faker.name.lastName(),//lastname,
        faker.internet.email(),
        faker.phone.phoneNumber(),//phone,
        faker.address.country(),

        // this param is not required
        //username_sponsor,

        // Register plan
        0,
        faker.datatype.number(10),
        faker.address.direction(),

        // Information user
        username,
        Crypto.SHA256(password, 'SuperSecrets').toString(),

        // verificamos si el usuario se registra con wallets alypay
        null,
        null,
        faker.internet.domainName(),

        // Info about airtm
        null,//existAirtm ? emailAirtm : null,
        null,//existAirtm ? aproximateAmountAirtm : null,
        0, //alypay === true ? 1 : 0,
        1
    ]

    console.log(username, password, paramsRegister)
    const result = await sql.run(queries.ALYTRADE_NEWUSER, paramsRegister)
    const { response } = result[0].pop()
    console.log(response)
    const obj = JSON.parse(response)
    console.log(obj)
    /*
    informationId
    userId
    investment
    */
    console.log(typeof obj.informationId)
    expect(typeof obj.informationId).toBe('number')
    expect(typeof obj.userId).toBe('number')
    expect(typeof obj.investment).toBe('number')

})

test.skip("Alytrade | Obtención de informacion by userId", (done) => {
    sql.run(queries.ALYTRADE_GETUSERINFO, [46]).then(result => {
        console.log(result)
        const {
            id,
            username,
            firstname,
            lastname,
            email,
            phone
        } = result[0]

        console.log(JSON.stringify({
            id, username, firstname,
            lastname,
            email,
            phone
        }, null, 4))
        done()
    })
})

test.skip("Alytrade | Upgrade de Speedtradings a Alytrade", async () => {
    // Parametros para la funcion de newUserAlytrade,
    /*
        54
55
56
57
58
59
60
61
62
63
68
74
75
76
77
78
    */
    const userId = 55
    const id_currency = 1
    const alytradePlan = 1
    const investmentParams = [
        id_currency,
        userId,
        hash = 'h:' + faker.name.firstName(),
        amount = 1,
        emailAirtm = '',
        aproximateAmountAirtm = 0,
        alypay = false
    ]
    try {
        /* ejecutamos la query para registar el investment */
        await sql.run(queries.ALYTRADE_INSERT_INVESTMENT, investmentParams)

        /* ejecutamos query para ingresar el usuario a la tabla de alytrade */
        await sql.run(queries.ALYTRADE_UPGRADE, [userId])

        /* Ingresamos el plan de Alytrade asociando el investment */
        const investmentDs = await sql.run(queries.ALYTRADE_GET_LASTINVESTMENT_FROM_USER, [userId, id_currency])
        const { id: investmentId } = investmentDs[0]
        console.log(investmentDs[0])

        await sql.run(queries.ALYTRADE_INSERT_INVESTMENT_PLAN, [investmentId, alytradePlan])

        console.log("finished")
    } catch (err) {
        console.error(err)
    }

})


test.skip("Alytrade | Date", async done => {
    const planCatalog = await getCatalog()
    const serverDate = new Date(2021, 4, 26)// await getServerDate()
    const fecha = new Date(2021, 4, 27)

    const diff = moment(serverDate).diff(fecha, 'd')
    const diffhours = moment(serverDate).diff(fecha, 'h')
    console.log({ fecha, serverDate, diff, diffhours, isPayday: diff === 0 && diffhours >= 0 })

    done()
})

test.skip("Alytrade | Interest batch process", async done => {
    const meses = 20
    const dias = 8
    const fechaInicial = new Date(2021, 3, 22)
    let fechas = []

    for (let mes = 0; mes < meses; mes++) {
        let fecha = moment(fechaInicial).add(mes, 'M')
        for (let dia = 0; dia < dias; dia++) {
            fechas.push(fecha.add(1, 'd').toDate())
        }
    }
    //console.log(JSON.stringify(fechas,null,4))
    //return 
    const planCatalog = await getCatalog()
    const investments = await getUnexpiredInvestents()
    //const fecha = new Date(2021, 7, 25)//await getServerDate()

    if (!Array.isArray(investments)) {
        console.log("Investment no trae elementos")
        return
    }

    const operaciones = []
    //console.log(await getServerDate())
    //fechas = [
    //   new Date("2021-06-26")
    //]

    for (let fecha of fechas) {
        const oper = investments.map(invest => {
            return () => insertInterestProcess(invest.investmentId, invest.start_date, invest.amount, invest.investmentplans_id, planCatalog, fecha)
        })
        operaciones.push(
            ...oper
        )
    }
    //console.log(operaciones)
    console.log("Numero de operaciones", operaciones.length)
    Promise.all(
        operaciones.map(promise => promise().catch(err => { return err }))
    ).then(result => {
        console.log(JSON.stringify(result, null, 4))
        done()
    })

})


test.skip("Alytrade | date comparison", async done => {
    const planCatalog = await getCatalog()
    const investments = await getUnexpiredInvestents()
    const serverDate = new Date(2021, 7, 25) //await getServerDate()

    investments.map(investment => {
        //console.log(investment)
        const plan = planCatalog.find(item => item.id === investment.investmentplans_id)
        //const expirationDate = moment(investment.start_date).add(plan.months, 'M')
        //const daysUntilExpire = moment(expirationDate).diff(serverDate, 'd')
        const payDays = generatePayDays(serverDate, investment.start_date, plan.months).map(pd => {
            return {
                pd,
                daysUntilPay: moment(pd).diff(serverDate, 'd')
            }
        })
        /*console.log({
            serverDate,
            investmentId: investment.investmentId,
            months: plan.months,
            start_date: investment.start_date,
            expirationDate: expirationDate.toDate(),
            daysUntilExpire,
            payDays
        })*/
        return investment
    })

})