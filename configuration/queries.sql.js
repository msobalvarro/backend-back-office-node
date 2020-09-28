/**Contain all queries of the aplication */
module.exports = {
    /**
     * Function returns string
     * **params**: `email` and `password` strings
     */
    login: 'call Login (?, ?)',

    /**
    * Consulta para confirmar login de administrador
    * **params**: `email` and `password` strings
    */
    loginAdmin: 'call loginAdmin (?, ?)',

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
    register: 'call newUser(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',

    /**Retorna todos los planes activos para seleccionar */
    collectionPlan: `
        select plan.id, currency.name, plan.id_currency, plan.amount
        from investment_plan plan
        inner join currency on currency.id = plan.id_currency;    
    `,

    /**Retorna todos los planes activos para seleccionar */
    collectionPlanById: `
        select plan.id, currency.name, plan.id_currency, plan.amount
        from investment_plan plan
        inner join currency on currency.id = plan.id_currency and currency.id = ?;    
    `,

    /**
     * Retorna un usuario si existe 
     * `Params:` *Username*
     * */
    comprobateUsername: `
        select user.id
        from users user where username = ?
    `,

    /**
     * Retorna un usuario existente esta activo
     * `Params:` *Username*
     * */
    comprobateUsernameExisting: `
        select CONCAT(info.firstname, " ", info.lastname) as name
        from users usr 
        inner join investment plan on plan.id_user = usr.id and plan.approved = 1
        inner join information_user info on info.id = usr.id_information
        where username = ?
        group by usr.id
    `,

    /**
     * Retorna un correo si existe 
     * `Params:` *email*
     * */
    comprobateEmail: `
        select id from information_user
        where email = ?
    `,

    /**
     * Este listado de procedimientos 
     * se ejecutan para sacar toda la informacion 
     * del dashboard
     * 
     * `params`: *userID*, *currencyID*
     */
    getDataChart: 'call getDataChart(?, ?)',
    getDetails: 'call getDetails(?, ?)',
    getProfits: 'call getProfits(?, ?)',
    getTotalPaid: 'call getTotalPaid(?, ?)',

    /**Procedimiento que crea un plan de inversion */
    createPlan: `call createPlan(?, ?, ?, ?, ?, ?, ?)`,

    /**Actualiza el monto del plan, Recibe dos argumentos:
     *
     * @param {Number} id_investment
     * @param {Number} amount
     * @param {String} hash
     * @param {String} email_airtm
     * @param {Number} aproximate_amount
     */
    planUpgradeRequest: `
        insert into request_plan_upgrade (id_investment, amount, hash, email_airtm, aproximate_amount, approved, date, alypay)
        values (? , ?, ?, ?, ?, ?, ?, ?)
    `,

    /**
     * Obtiene todos los registros patrocinado
     * recibe como parametro `id` **INT**
     * 
     */
    getAllSponsored: `
        SELECT spn.*, usr.* FROM sponsors spn 
        inner join information_user usr on usr.id = spn.id_information_user
        where spn.approved = 1 and spn.id_referred = ?;
    `,

    // Queries para Back Office

    /**Obtiene la lista de todos los solicitantes a un upgrades */
    getAllUpgrades: `call getAllUpgrades()`,


    /**Obtiene solicitudes de registro */
    getAllRequest: `call getAllRequest()`,

    /**Obtiene todos los registros que **SI** se han aprobado */
    getAllRecords: `call getAllRecords()`,

    /**
     * Obtiene todos los detalles del plan de inversion solicitad. 
     * 
     * Parametro obligatorio: `id` **INT**
     * 
    */
    getRequestDetails: `call getRequestDetails(?)`,


    /**
     * Obtiene detalles superficiales del plan solicitado
     * 
     * @param {number} id_investment
     */
    getRequestInvestmentDetails: `
        select 
            invest.id,	
            CONCAT(infUsr.firstname, ' ' , infUsr.lastname) as name,
            infUsr.email,	
            infUsr.id as id_information,
            invest.hash,
            invest.amount,
            invest.id_currency,
            invest.email_airtm,
            invest.aproximate_amount
        from investment invest
        inner join users user on user.id = invest.id_user
        inner join information_user infUsr on infUsr.id = user.id_information
        where invest.id = ?; 
    `,

    /**
     * 
     * Obtiene todos los detalles de los planes de inversion del usuario seleccionado,
     * recibe como parametro el `id` de usuario seleccionado.
     * 
     */
    getRecordDetails: `call getRecordDetails(?)`,

    /**
     * 
     * Obtiene todos los detalles de los planes de inversion del usuario seleccionado,
     * recibe como parametro el `id` de usuario seleccionado.
     * 
     */
    getUpgradeDetails: `call getUpgradeDetails(?)`,


    /**
     * Esta accion elimina el registro de plan solicitad
     * 
     * parametro obligatorio: `id` **INT**
    */
    declineRequest: `DELETE FROM investment WHERE (id = ?)`,

    /**
     * 
     * Esta accion elimina la solicitud de upgrade
     */
    declineUpgrade: `DELETE FROM request_plan_upgrade WHERE (id = ?)`,

    /**
     * Esta accion acpeta el registro de plan solicitad
     * 
     * parametro obligatorio: `id` Investmeent **INT**
    */
    acceptRequest: `call acceptRequest(?);`,

    /**
     * Esta accion acepta el UPGRADE Solicitado
     * 
     * parametro obligatorio: `id` Request Plan Upgrade **INT**
    */
    acceptUpgrade: `call acceptUpgrade(?);`,

    /**
     * Consulta para ejecutar un reporte de ganancias, los paramtos son:
     * 
     * * id_investment **INT**
     * * pecentage **Float**
     * * amount **FLoat**
     * 
     * */
    executePay: `
        INSERT INTO payments (id_investment, date, percentage, amount) 
        VALUES (?, NOW(), ?, ?);
    `,

    /**
     * Consulta los datos necesarios para ejecutar pago de trading,
     * Parametros requeridos:
     * 
     * * id_currency: **INT**
     */
    getDataTrading: `call getDataTrading(?)`,

    /**
     * 
     * Consulta que trae el reporte de cuanto hay que pagar por usuario,
     * parametro requerido: `id_currency` **INT**
     */
    getAllPayments: `call getReportPayments(?)`,


    /**
     * Consulta para activar la cuenta 
     * 
     * Parametro requerido `username` **string**
     */
    activateAccount: `UPDATE users SET enabled = '1' WHERE (username = ?)`,

    /**
     * 
     * Consulta para crear reportes de retiros,
     * representa los depositos de la semana a los inversores
     * 
     * Parametros requeridos:
     * * id_investment: `INT`
     * * hash: `STRING`
     * * amount: `FLOAT`
     */
    createWithdrawals: `call createWithdrawals(?, ?, ?, ?)`,


    /**
     * Ingresa una nueva solicitud de exchange
     * 
     * Parametros:
     * * currency: `STRING`
     * * hash: `STRING`
     * * amount: `FLOAT`
     * * request_currency: `STRING`
     * * approximate_amount: `FLOAT`
     * * wallet: `STRING`
     * * label: `STRING` **(NO REQUERIDO)**
     * * memo: `STRING` **(NO REQUERIDO)**
     * * email: `STRING` **(NO REQUERIDO)**
     */
    createRequestExchange: `call createRequestExchange(?, ?, ?, ?, ?, ?, ?, ? , ?, ?)`,

    /**Retorna todas las solictudes de Exchange */
    getAllExchange: `SELECT * FROM request_exchange where active = 1`,

    /**
     * Inserta un nuevo registro al declinar una solicitud de intercambio (EXCHANGE) 
     * 
     * Parametros requeridos:
     * * id_request: `INT`
     * * reason: `STRING`
     * */
    setDeclineExchange: `call setDeclineExchange(?, ?)`,

    /**
     * Inserta un nuevo registro al aceptar una solicitud de intercambio (EXCHANGE) 
     * 
     * Parametros requeridos:
     * * id_request: `INT`
     * * hash: `STRING`
     * */
    acceptRequestExchange: `call acceptRequestExchange(?, ?)`,

    /**
     * Obtiene todos los correos electronicos registrados en el sistema
     */
    getEMails: `select CONCAT(firstname, " ", lastname) as fullname, email from information_user`,

    /**
     * Consulta que actualiza los campos: 
     * * wallet_btc
     * * wallet_eth
     * * user_coinbase
     * 
     * de la tabla users, recibe como parametros: 
     * * wallet_btc: `STRING`
     * * wallet_eth: `STRING`
     * * user_coinbase: `STRING`
     * * id: `INT`
     */
    updateWallets: `
        UPDATE users 
        SET wallet_btc = ?, 
            wallet_eth = ?
        WHERE (id = ?);
    `,

    /**
     * Consulta que actualiza los datos de wallet alypay
     * 
     * @param {string} btc
     * @param {string} eth
     * @param {number} state
     */
    updateWalletAlyPay: `
        UPDATE wallet_alypay 
        SET btc = ?, 
            eth = ?,
            state = ?
        WHERE (id_user = ?);
    `,

    /**
     * Consulta que retorna datos para la view profile
     * 
     * parametros requeriods:
     * * id_user: `INT`
     */
    getInfoProfile: `call get_info_profile(?)`,


    /**
     * Consulta para buscar un hash en toda la base de datos.
     * 
     * -- --
     * @param {String} hash
     */
    searchHash: `call searchHash(?)`,

    /**
     * Obtiene el currency del plan por id
     * -- --
     * @param {Number} id
     */
    getCurrencyByPlan: `SELECT id_currency as currency FROM investment where id = ?`,

    /**
    * Consulta para crear una solicitud de Money Changer
    * 
    * @param {String} type
    * @param {String} coin_name
    * @param {Number} price_coin
    * @param {Number} amount_usd
    * @param {Number} amount_fraction
    * @param {String} manipulation_id
    * @param {String} email_airtm
    * @param {String} wallet
    * @param {String} hash
    */
    createMoneyChangerRequest: `call createMoneyChangerRequest(?, ?, ?, ?, ?, ?, ?, ?, ?)`,

    /**
     * Consulta para obtener todas las solicitudes de `Money Changer`
     */
    getMoneyChangerRequest: `select * from money_changer where active = 1;`,

    /**
     * Consulta para desactivar solicitud de Money Changer
     * 
     * @param {Number} id
    */
    setInactiveChangeRequest: `UPDATE money_changer SET active = 0 WHERE (id = ?)`,

    /**
     * Consulta para guardar historial de Trading Day  -  [id, percentage, newAmount]
     * 
     * @param {Number} id
     * @param {Number} Percentage
     * @param {Number} amount
     */
    createPayment: `call createPayment(?, ?, ?)`,

    /**
     * Consulta que rechaza solicitud de compra y venta en **Money Changer**
     * 
     * @param {Number} id
     * @param {String} Reason
     */
    declineMoneyChangerRequest: `call declineMoneyChangerRequest(?, ?)`,


    /**
     * Consulta que obtiene la informacion del cliente desde el ID plan
     * 
     * @param {Number} idPlan
     */
    getDataInformationFromPlanId: `
        select info.* from investment plan
        inner join users usr on usr.id = plan.id_user
        inner join information_user info on info.id = usr.id_information
        where plan.id = ?

    `,

    /**
     * Procedimiento que cambia el passwor
     * @param {Number} pinSecurity
     * @param {Number} idUser
     * @param {String} password
     */
    changePassword: `call changePassword(?, ?, ?)`,

    /**
     * sql que retorna informacion de usuario atravez de correo electronico
     * @param {String} email
     */
    getInfoUser: `select * from information_user where email = ?`,


    /**
     * sql que retorna informacion de la tabla usuario pasando como parametro el id
     * @param {Number} id
     */
    getUser: `select * from users where id_information = ?`,


    /**
     * Consulta para ingresar registro de cambio de password
     * @param {Number} id_user
     * @param {Number} pin
     * @param {Date} date
     */
    insertPinSecurity: `
        insert into reset_password (id_user, pin, enabled, date) 
        values (
            ?, ?, 1, ?
        )
    `,


    /**
     * Consulta para obtener el registro de change password
     * 
     * @param {Number} pinCode
     */
    getInfoPin: `select * from reset_password where pin = ? and enabled = 1`,


    /**
     * Consulta para obtener el registro activo de cambio de password
     * 
     * @param {Number} id_user
     */
    getInfoPinActive: `select * from reset_password where id_user = ? and enabled = 1`,

    /**
     * Consulta que obtiene el id del usuario
     * @param {string} username
     */
    getIdByUsername: `select id from users where username  = ?`,

    /**
     * Consulta que inserta direcciones wallet alypay
     * @param {number} id_user
     * @param {string} wallet_btc
     * @param {string} wallet_eth
     * @param {Date} date_create,
     * @param {number} state
     */
    insertWalletAlyPay: `
        INSERT INTO wallet_alypay (id_user, btc, eth, date_create, state)
        VALUES (?, ?, ?, ?, ?)
    `,


    /**
     * Consulta que obtiene el monto de todos los upgrades en el dia
     * 
     * @param {Date} time
     * @param {number} id_investment
     */
    getUpgradeAmount: `
        SELECT SUM(amount) as amount
        FROM request_plan_upgrade
        WHERE 	DATE(date) = DATE(?)
        AND 	id_investment = ?
        AND		approved = 1
    `,

    /**
     * Consulta que obtiene el id del plan
     * 
     * @param {number} id_user
     * @param {number} id_currency
     */
    getIdInvestment: `
        SELECT id FROM investment i 
        WHERE i.id_user = ?
            AND i.id_currency = ?
            AND i.enabled = 1
            AND i.approved = 1    
    `,

    /**
     * consulta que obtiene el historial largo de reportes de tradings
     * @param {number} id_investment
     */
    getHistoryTrading: `
        SELECT * FROM payments 
        where id_investment = ?
        order by id desc
    `,

    /**
     * consulta que obtiene el historial corto (TOP 10) de reportes de tradings
     * @param {number} id_investment
     */
    getShortHistoryTrading: `
        SELECT * FROM payments 
        where id_investment = ?
        order by id desc
        limit 10    
    `,

    getActiveCommissions: `
        SELECT 
            id_name_action as id,
            name_sponsor sponsor,
            name_coin coin,
            date_payment date
        FROM view_payment_referred_sponsor;
    `


}