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
    register: 'call newUser(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',

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
        select usr.id
        from users usr 
        inner join investment plan on plan.id_user = usr.id and plan.approved = 1
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
    createPlan: `call createPlan(?, ?, ?, ?)`,

    /**Actualiza el monto del plan, Recibe dos argumentos:
     * 
     * * `amount` **float**
     * * `id` **int**
     */
    planUpgradeRequest: `
        insert into request_plan_upgrade (id_investment, amount, hash, approved)
        values (? , ?, ?, 0)
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
    

    /**Obtiene todos los registros que no se han aprobado */
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

}