/**Contain all queries of the aplication */
module.exports = {
    /**
     * Function returns string
     * **params**: `email` and `password` strings
     */
    login: 'call Login (?, ?)',

    /**
     * Function returns success
     * **params**: 
     * 
     *       firstname,
     *       lastname,
     *       email,
     *       phone,
     *       country,
     * 
     *       `this param is not required`
     *       username_sponsor
     * 
     *       id_investment_plan
     *       hash,
     *       username,
     *       password,
     *       wallet,
     *
     * 
     */
    register: 'call newUser(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',

    /**Retorna todos los planes activos para seleccionar */
    collectionPlan: `
        select plan.id, currency.name, plan.id_currency, plan.amount
        from investment_plan plan
        inner join currency on currency.id = plan.id_currency;    
    `,

    comprobateUsername: `
        select user.id
        from users user where username = ?
    `
}