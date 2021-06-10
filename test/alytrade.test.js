const faker = require('faker')
const Crypto = require('crypto-js')
const queries = require('../alytrade/sql')
const sql = require('../configuration/sql.config')
const moment = require('moment')
const {
    getCatalog,
    getUnexpiredInvestents,
    generatePayDays,
    insertInterestProcess
} = require('../alytrade/cronjob/methods')
const { getAlytradeInvestmentsByUserId, getAlytradeInvestmentInterestByInvestment } = require("../alytrade/repository")
const { doge } = require('../middleware/hash.middleware')
const { userManagementService } = require('../alytrade/services')
const { sequelize } = require('../configuration/sql.config')
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

test.skip("Alytrade | get Investments by ID", async done => {
    //const result = await getAlytradeInvestmentsByUserId(54)
    //const result = await getAlytradeInvestmentInterestByInvestment(526)
    const result = await getCatalog()
    console.log(result)
    done()
})

const commiter = random => {
    return new Promise((resolve, reject) => {
        sql.pool.getConnection((err, conn) => {
            if (err)
                reject(err)

            conn.beginTransaction(erx => {
                console.log("Comienza transaccion")
                if (erx)
                    reject(erx)

                conn.query("INSERT INTO dummy(dummy) values (?)", [random], (e, r) => {
                    if (e)
                        reject(e)

                    conn.commit((ec, cmm) => {
                        if (ec) {
                            conn.rollback(erol => {
                                console.log("Rollback error")
                            })
                            reject(erol)

                            conn.query("select LAST_INSERT_ID() as id", (er, result) => {
                                if (er)
                                    reject(er)

                                resolve({ random, result: JSON.stringify(result) })
                            })
                        }
                    })
                })
            })
        })
    })
}

test.skip("multiple inserts", done => {
    const operaciones = []
    for (let i = 0; i < 10; i++) {
        operaciones.push(() => commiter(i).catch(err => { return err }))
    }

    console.log("Operaciones" + operaciones.length)
    Promise.all(operaciones.map(item => item()))
        .then(result => {
            console.log(JSON.stringify(result))
            done()
        })

})

test.skip("test de dogehash", async _ => {
    const hash = "d8d8d87b3567b58ce121a46ddcf5c85b9674a3c9959daac4cbfca3aa10b4a770c708"
    const result = await doge(hash, 196)
    console.log(result)
})

test.skip("Transaction creacion de usuario", async _ => {

    const runQuery = (pool, sqlScript = '', params = []) => new Promise((resolve, reject) => {
        pool.query(sqlScript, params, (err, resultsCallback) => {
            // verificamos si hay errro en la sql
            if (err) {
                reject(err.message)
            } else {
                // ejecutamos un `success`
                resolve(resultsCallback)
            }
        })
    })

    const insertUser = ({
        username, password, enabled, kyc_type,
        firstname, lastname, email, phone, country, more_info
    }) => {
        return new Promise((resolve, reject) => {
            const insertUsuario = `INSERT INTO users
            (id_information, username, password, enabled, kyc_type)
            VALUES(?, ?, ?, ?, ?);
            `
            const insertInformationUser = `INSERT INTO information_user
            (firstname, lastname, email, phone, country, more_info)
            VALUES(?, ?, ?, ?, ?, ?);
            `
            const insertAlytradeInformation = `INSERT INTO speedtradings.alytrade_information
            (user_id)
            VALUES(?);`
            sql.pool.getConnection((e, conn) => {
                if (e)
                    reject(e)

                conn.beginTransaction(async err => {
                    if (err)
                        reject('Error al iniciar transaccion ')

                    // Inserta en InformationUser
                    await runQuery(conn, insertInformationUser, [firstname, lastname, email, phone, country, more_info])
                    const iuId = await runQuery(conn, "select LAST_INSERT_ID() id ")
                    const { id: id_information } = iuId[0]

                    //Inserta en Users
                    console.log("id_information", id_information)
                    await runQuery(conn, insertUsuario, [id_information, username, password, enabled, kyc_type])

                    //Inserta en alytradeUsers
                    const userIdDs = await runQuery(conn, "select LAST_INSERT_ID() id ")
                    const { id: userId } = userIdDs[0]
                    console.log("userId", userId)
                    await runQuery(conn, insertAlytradeInformation, [userId])

                    conn.commit((err) => {
                        if (err) {
                            conn.rollback(err => { throw err })
                            reject(err)
                        }
                        resolve(userId)
                    })
                })
            })
        })
    }

    const insertInvestmentPlan = ({
        id_currency, id_user, hash, amount, approved, enabled,
        investmentplans_id
    }) => {
        return new Promise((resolve, reject) => {
            const insertInvestment = `INSERT INTO investment
            (id_currency, id_user, start_date, hash, amount, approved, enabled, alypay)
            VALUES(?, ?, now(), ?, ?, ?, ?, 0);
            `

            const insertInvestPlan = `INSERT INTO alytrade_investment_plan
            (investment_id, investmentplans_id,expired)
            VALUES(?, ?,0);
            `
            sql.pool.getConnection(async (err, conn) => {
                if (err)
                    reject(err)

                // Insercion de Investment
                await runQuery(conn, insertInvestment, [id_currency, id_user, hash, amount, approved, enabled])
                const iDs = await runQuery(conn, "select LAST_INSERT_ID() id ")
                const { id: investmentId } = iDs[0]
                console.log("investmentId", investmentId)

                // insercion de investment plan
                await runQuery(conn, insertInvestPlan, [investmentId, investmentplans_id])
                conn.commit((err) => {
                    if (err) {
                        conn.rollback(err => { reject(err) })
                        reject(err)
                    }
                    resolve(investmentId)
                })

            })
        })
    }

    insertUser({
        username: 'wesker', password: "computehash", enabled: 0, kyc_type: 1, firstname: "albert", lastname: "wesker",
        country: "Nicaragua", email: "email@gmail.com", more_info: "MoreInfo", phone: "84661931"
    }).then(userId => {
        insertInvestmentPlan({
            id_currency: 1, id_user: userId, amount: 0.02, approved: 1, enabled: 1, hash: 'walletHash', investmentplans_id: 1
        }).then(investmentId => {
            console.log("InvestmentID", investmentId)
            console.log("OK")
        })
        console.log("UserId", userId)
    }).catch(e => {
        console.log("error", e)
    })

})
const { UsersModel, AlytradeInvestmentPlansCatalog, InformationUserModel, AlytradeInformation } = require('../models')
const { getUSDCryptoRate } = require('../alytrade/services/cryptoCurrency.service')
test.skip("sequelize test", async done => {
    const userId = 607
    const t = await sequelize.transaction()
    const [model, created] = await AlytradeInformation.findOrCreate({
        where: { user_id: userId },
        defaults: {
            user_id: userId
        },
        transaction: t
    })
    await t.commit()
    console.log({ model, created })
    done()
})

