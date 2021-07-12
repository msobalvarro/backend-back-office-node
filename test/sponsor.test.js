const models = require('../models')
const { DataTypes } = require('sequelize')
const { sequelize } = require('../configuration/sql.config')
const services = require('../alytrade/services')
const encodeBase64 = message => {
    return Buffer.from(message.trim(), 'utf-8').toString('base64')
}

const decodeBase64 = base64 => {
    return Buffer.from(base64, 'base64').toString('utf-8')
}

test.skip("Base64 encrypt decript", () => {
    const mensaje = "llarios89      "
    const base64 = encodeBase64(mensaje)
    const decrypted = decodeBase64(base64)

    console.log({
        mensaje,
        base64,
        decrypted
    })

    expect(mensaje.trim()).toBe(decrypted)
})

/**
 * Create a Sponsor row in Sponsor table, useful when the new user has been refered by another one
 * @param {{ userId:number, sponsor_username:string, currencyId:number, amount:number, months:number, transaction:Transaction }} param0 
 * @returns Sponsor Row
 */
const createSponsorRow = async ({ userId, sponsor_username, currencyId, amount, months, transaction }) => {

    /**
     * 1. Obtiene el catalogo de comisiones
     * 2. Obtiene los datos del sponsor
     * 3. Crea el row en tabla sponsors
     * 4. Actualiza el registro del usuario referido en alytrade_information
     */
    const commissionCatalog = (await models.AlyTradeSponsorCommissionCatalogModel.findAll()).map(item => item.toJSON())
    let commission
    if (months > 12)
        commission = commissionCatalog.find(item => item.months = -1)
    else
        commission = commissionCatalog.find(item => item.months === months)

    if (!commission) {
        throw "Error getting Commission"
    }

    const sponsorData = await models.UsersModel.findOne({
        include: models.InformationUserModel,
        attributes: ['id', 'id_information'],
        where: { username: sponsor_username }
    })


    const sponsorRow = await models.SponsorsModel.create({
        id_referred: userId,
        id_information_user: sponsorData.information_user.id,
        id_currency: currencyId,
        amount: amount * commission.percentage,
        //registration_date: ,
        approved: 0,
    }, { transaction })

    const userAlytradeInformation = await models.AlytradeInformationModel.findOne({
        where: { user_id: sponsorData.id }
    })
    if (!userAlytradeInformation)
        throw 'Sponsor is not registered in AlyTrade'

    userAlytradeInformation.alytrade_sponsor_user_id = sponsorData.id
    userAlytradeInformation.sponsors_id = sponsorRow.id
    await userAlytradeInformation.save({ transaction })

    console.log(userAlytradeInformation)

    return sponsorRow
}

test.skip('Insert into sponsors', async (done) => {

    const u = await models.UsersModel.findOne({
        include: models.InformationUserModel,
        attributes: ['id'],
        where: { id: 603 }
    })

    const t = await sequelize.transaction()
    try {


        const rowFinal = await createSponsorRow({
            amount: 0.31,
            currencyId: 1,
            months: 13,
            sponsor_username: 'Quitpinzon2',
            transaction: t,
            userId: u.id
        })

        console.log(rowFinal.toJSON())
    } catch (err) {
        console.log(err)
    } finally {
        await t.rollback()
    }

    done()
})

test.skip('Create a new AlytradeUser using sponsor', async (done) => {
    await services.userManagementService.createNewAlytradeAccount({
        firstname: 'Dora',
        lastname: 'La exploradora',
        email: 'dora@gmail.com',
        phone: '88888888',
        country: 'Nicaragua',
        more_info: 'More Info about dora',
        username: 'Doramon3',
        password: '123456',
        id_currency: 1,
        hash: '0x000000000000000000',
        amount: 10,
        months: 14,
        sponsor_username: 'Quitpinzon2',
        wallet: '0x00000000000001'
    })
    done()
},3600000)