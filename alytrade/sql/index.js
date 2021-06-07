
const ALYTRADE_NEWUSER = "call alyTradeNewUser(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"

const ALYTRADE_UPGRADE = `INSERT INTO alytrade_information(user_id) VALUES (?)` 

const ALYTRADE_INSERT_INVESTMENT = `INSERT INTO investment 
(id_currency, id_user, start_date, hash, amount, email_airtm, aproximate_amount, enabled, approved, alypay)
values (
?,
?,
now(),
?,
?,
?,
?,
1,
0,
?)`

const ALYTRADE_GETUSERINFO = `SELECT u.id, u.username, ui.firstname, ui.lastname, ui.email, ui.phone
    FROM users u
    INNER JOIN information_user ui on u.id_information = ui.id
    WHERE u.id = ?
`

const ALYTRADE_INSERT_INVESTMENT_PLAN = `INSERT INTO alytrade_investment_plan
(investment_id, investmentplans_id)
VALUES(?, ?)
`

const ALYTRADE_GET_LASTINVESTMENT_FROM_USER = `SELECT i.id FROM investment i 
WHERE 
i.id_user = ?
and i.id_currency = ?
order by i.id desc `

module.exports = {
    ALYTRADE_NEWUSER,
    ALYTRADE_UPGRADE,
    ALYTRADE_INSERT_INVESTMENT,
    ALYTRADE_GETUSERINFO,
    ALYTRADE_GET_LASTINVESTMENT_FROM_USER,
    ALYTRADE_INSERT_INVESTMENT_PLAN
}