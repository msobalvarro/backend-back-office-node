const faker = require('faker')
const Crypto = require('crypto-js')
const queries = require('../controller/alytrade/sql')
const sql = require('../configuration/sql.config')


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
