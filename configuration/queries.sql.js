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
    loginAdmin: 'select * from admin_users where email = ? and password = ?;',

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
     * @param {number} id_user (x2)
     *
     */
    getAllSponsored: `call view_referred_sponsor(?)`,

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
     * @param {number} id_investment INT
     */
    getRequestInvestmentDetails: `
        select invest.id,
            CONCAT(infUsr.firstname, ' ', infUsr.lastname)     as name,
            infUsr.email,

            invest.hash,
            invest.amount,
            invest.id_currency,
            invest.email_airtm,
            invest.aproximate_amount,

            UsrSpons.username                                  as sponsor_username,
            CONCAT(infSpons.firstname, ' ', infSpons.lastname) as sponsor_name,
            infSpons.email                                     as sponsor_email,
            IF(wa.btc != "", wa.btc, UsrSpons.wallet_btc)      as sponsor_wallet_btc,
            IF(wa.eth != "", wa.eth, UsrSpons.wallet_eth)      as sponsor_wallet_eth,
            IF(wa.eth != "", 1, 0)                             as alypay_sponsor
        from investment invest
            inner join users user on user.id = invest.id_user
            inner join information_user infUsr on infUsr.id = user.id_information


            left join sponsors sponsor on sponsor.id = user.id_sponsor
            left join users UsrSpons on UsrSpons.id = sponsor.id_referred
            left join wallet_alypay wa on wa.id_user = UsrSpons.id
            left join information_user infSpons on infSpons.id = UsrSpons.id_information
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
     * Obtiene la información de expiración de los planes de un usuario
     * @param {Number} id_users - id del usuario
     */
    getInvestmentExpireInfo: `
        select 
            * 
        from investment_nextto_expire 
        where id_users = ?
    `,

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
    declineRequest: `call reject_investment(?)`,

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
        SELECT id, approved FROM investment i 
        WHERE i.id_user = ?
            AND i.id_currency = ?
            AND i.enabled = 1 
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
     * consulta que obtiene el historial largo de reportes de tradings según un rango
     * de fechas
     * @param {number} id_investment
     * @param {String} date_from - fecha de inicio del historial
     * @param {String} date_to - fecha final del historial
     */
    getHistoryTradingByDateRanges: `
        SELECT * 
        FROM payments p
        where 
            id_investment = ? and
            p.date >= ? and 
            p.date <= ?
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

    /**
     * Consulta para obtener las comisiones activas
     */
    getActiveCommissions: `
        SELECT 
            id_payment_referred as id,
            name_sponsor sponsor,
            name_coin coin,
            amount,
            percentage_fees as percentage,
            date_payment date
        FROM view_payment_referred_sponsor
        WHERE ISNULL(hash)
        ORDER BY date ASC;
    `,

    /**
     * Obtiene el detalle de la comision por id
     *
     * @param {number} id
     */
    getCommissionById: `
        SELECT * 
        FROM view_payment_referred_sponsor
        WHERE id_payment_referred = ? AND ISNULL(hash);
    `,

    /**
     * Consulta que ejecuta un procedimiento almacenado
     * para dar respuesta a la lista de comisiones
     *
     * @param {number} id_payment_referred
     * @param {string | any} hash
     *
     *
     * Si el hash es `null` es porque la respuesta fue rechazo,
     * de lo contrario se aceptara el pago de la comision
     */
    createResponsePayComission: `call accept_payment_referred(?, ?)`,

    /**
     * Consulta para buscar un plan por usuario
     *
     * @param {number} id_currency
     * @param {number} id_user
     */
    searchPlan: `
        SELECT * FROM investment 
        WHERE id_currency = ?
        AND id_user = ?
        AND enabled = 1
        AND approved = 0
    `,

    /**
     * Consulta que jala la informacion sobre todas la ejecuciones de los upgrades
     * con rango de fechas
     */
    getReportsUpgrades: `
        SELECT 
            CONCAT(info.firstname, " ", info.lastname) as name,
            upgrade.amount,
            IF(plan.id_currency = 1, "BTC", "ETH") as coin,
            upgrade.date as date
        FROM request_plan_upgrade upgrade
        INNER JOIN investment plan on plan.id = upgrade.id_investment
        INNER JOIN users user on user.id = plan.id_user 
        INNER JOIN information_user info on info.id  = user.id_information 
        WHERE upgrade.date >= ? AND upgrade.date <= ?;    
    `,

    /**
     * Consulta que obtiene un reporte de los exchanges realizados dentro
     * de un periodo de tiempo
     * @param {String} startDate - fecha de inicio
     * @param {String} cutoffDate - fecha final
     */
    getReportExchange: `
        select 
            re.currency,
            re.amount,
            re.coin_price,
            (re.amount * re.coin_price) as 'amount_usd',
            re.request_currency as target_currency,
            re.approximate_amount as target_amount,
            re.email,
            re.wallet,
            ae.hash,
            ae.date
        from request_exchange re, accept_exchange ae
        where re.id = ae.id_request 
            and ae.date >= ? 
            and ae.date <= ?
    `,

    /**
     * COnsulta que saca reportes de pagos de trading diarios con rango de fechas
     */
    getReportsPayments: `
        SELECT 
            CONCAT(info.firstname, " ", info.lastname) as name,
            plan.id_currency as currency,
            pay.amount,
            pay.percentage,
            pay.date 
        FROM payments pay
        INNER JOIN investment plan on plan.id = pay.id_investment 
        INNER JOIN users usr on usr.id = plan.id_user 
        INNER JOIN information_user info on info.id = usr.id_information 
        WHERE pay.date >= ? AND pay.date <= ?;
    `,

    /**
     * Registra un nuevo archivo dentro la tabla 'files' en la base de datos
     * @param {String} Pname - Nombre del archivo a registrar
     * @param {String} Ptype - Tipo de archivo que está siendo almacenado
     * @param {Number} Psize - Tamaño del archivo a almacenar
     * @param {Number} Padmin - Inidica si es un admin quien almacena el archivo (1: true)
     * @param {Number} idFile - Id del archivo en caso de que exista
     * @return {Number} id - Retorna el id que tendrá el registro del archivo en la BD
     */
    insertionFiles: `
        call insertion_files(?, ?, ?, ?, ?)
    `,

    /**
     * Obtiene el nombre y el tipo de un archivo a partir de su id de registro
     * @param {Number} file_id
     */
    getFileById: `
        SELECT
            name,
            type,
            admin
        FROM files
        WHERE id = ?
    `,

    /**
     * Consulta para obter los reportes de money changer con rangos de fecha
     */
    getReportMoneyChanger: `
        SELECT 
            type, 
            coin_name, 
            price_coin, 
            amount_usd, 
            amount_fraction, 
            manipulation_id, 
            email_airtm, 
            wallet, 
            hash, 
            date
        FROM money_changer mc
        WHERE active = 0 AND date >= ? AND date <= ?;;
    `,

    /**
     * Guarda el registro del kyc de un usuario
     * @param {Number} Pid_users - Id del usuario
     * @param {Number} Pid_type_identification - Tipo de identificación
     * @param {Date} Pbirthday - Fecha de nacimiento,
     * @param {String} Pidentification_number - Número identificación,
     * @param {String} Palternative_number - Número telefoníco alternativo,
     * @param {String} Pnationality - Nacionalidad,
     * @param {String} Phonecode - Código teléfonico del país de nacionalidad,
     * @param {String} Pcurrency - Símbolo del país de nacionalidad,
     * @param {String} residence - País de residencia,
     * @param {String} Phonecode_two Código teléfonico del país de residencia,
     * @param {String} Pcurrency_two - Símbolo del país para el teléfono alternativo,
     * @param {String} Pprovince - Provincia,
     * @param {String} Pcity - Ciudad,
     * @param {String} Pdirection_one - Dirección línea 1,
     * @param {String} Pdirection_two - Dirección línea 2,
     * @param {String} Ppostal_code - Código postal,
     * @param {String} Panswer_one - Id del origen de fondos, en caso de ser la opción
     * 'otros', se envía el id del mismo seguido de un guión y luego el valor ingresado,
     * @param {String} Panswer_two - Segunda pregunta de control,
     * @param {String} Panswer_three - Tercera pregunta de control,
     * @param {Number} Pavatar - Id de la foto de perfil en la tabla de archivos,
     * @param {Number} Pidentification_photo - Id de la foto de la identificación en la tabla
     * de archivos
     */
    insertKycUser: `
        call insertion_information_users_kyc(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,

    /**
     * Guarda el registro de un beneficiario para el kyc de usuario
     * @param {Number} Pid_users - Id del usuario
     * @param {Number} Pid_relationship - Tipo del parentesco con el usuario
     * @param {String} Pfirstname - Nombres del beneficiario
     * @param {String} Plastname - Apellidos del beneficiario
     * @param {Number} Pid_type_identification - Tipo de identificación
     * @param {Date} Pbirthday - Fecha de nacimiento,
     * @param {String} Pidentification_number - Número identificación,
     * @param {String} Pprincipal_number - Número telefónicico principal
     * @param {String} Palternative_number - Número telefóníco alternativo,
     * @param {String} Pnationality - Nacionalidad,
     * @param {String} Phonecode - Código teléfonico del país de nacionalidad,
     * @param {String} Pcurrency - Símbolo del país de nacionalidad,
     * @param {String} residence - País de residencia,
     * @param {String} Phonecode_two Código teléfonico del país de residencia,
     * @param {String} Pcurrency_two - Símbolo del país para el teléfono alternativo,
     * @param {String} Pprovince - Provincia,
     * @param {String} Pcity - Ciudad,
     * @param {String} Ptutor - Indica sí el beneficiario hace el rol de tutor (1:sí, 0:no)
     * @param {String} Pdirection_one - Dirección línea 1,
     * @param {String} Pdirection_two - Dirección línea 2,
     * @param {String} Ppostal_code - Código postal,
     * @param {String} Panswer_one - Id del origen de fondos, en caso de ser la opción
     * 'otros', se envía el id del mismo seguido de un guión y luego el valor ingresado,
     * @param {String} Panswer_two - Segunda pregunta de control,
     * @param {String} Panswer_three - Tercera pregunta de control,
     * @param {Number} Pavatar - Id de la foto de perfil en la tabla de archivos,
     * @param {Number} Pidentification_photo - Id de la foto de la identificación en la tabla
     * de archivos
     * @param {String} Pemail - Correo del beneficiario
     */
    insertKycUserBeneficiary: `
        call insertion_beneficiary(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,

    /**
     * Almacena el tipo de cuenta kyc que el usuario está registrando
     * @param {Number} id_user - Id del usuario que realiza la petición
     * @param {Number} type_kyc - Tipo de cuenta kyc registrada (1: personal, 2: empresarial)
     */
    registerKycAccountType: `
        call insertion_kyc_type(?, ?)
    `,

    /**
     * Obtiene el tipo de kyc con el que cuenta un usuario
     * @param {Number} id_user - id del usuario
     */
    getKycAccountType: `
        select kyc_type from users where id = ?
    `,

    /**
     * Obtiene el Kyc de usuario a partir del id del mismo
     * @param {Number} id_user - Id del usario
     */
    getKycUserById: `
        select 
            iuk.id_users as idUser,
            CONCAT(iu.firstname, ' ', iu.lastname) as fullname,
            iu.email,
            u.reviewed,
            iuk.id_type_identification as identificationType,
            iuk.identification_number as identificationNumber,
            iuk.birthday ,
            iuk.alternative_number as alternativeNumber,
            (select c.phone_code from country c where c.id = iuk.nationality) as nationality,
            (select c.phone_code from country c where c.id = iuk.residence) as residence,
            iuk.province,
            iuk.city,
            iuk.direction_one as direction1,
            iuk.direction_two as direction2,
            iuk.postal_code as postalCode,
            iuk.answer_one as foundsOrigin,
            iuk.answer_two as estimateMonthlyAmount,
            iuk.answer_three as profession,
            iuk.avatar as profilePictureId,
            iuk.identification_photo as identificationPictureId
        from information_users_kyc iuk
        inner join users u
            on u.id = iuk.id_users
        inner join information_user iu
            on iu.id = u.id_information 
        where iuk.id_users = ?;
    `,

    /**
     * Obtiene el beneficiario dentro de un jyc de usuario
     * @param {Number} id_user - Id del usuario
     */
    getKycUserBeneficiaryById: `
        select
            iuk.birthday as userBirthday,
            b.id_type_identification as identificationType,
            b.birthday,
            b.firstname,
            b.lastname,
            b.identification_number as identificationNumber,
            b.principal_number as principalNumber,
            b.alternative_number as alternativeNumber,
            b.email,
            (select c.phone_code from country c where c.id = b.nationality) as nationality,
            (select c.phone_code from country c where c.id = b.residence) as residence,
            b.province,
            b.city,
            b.tutor,
            b.direction_one as direction1,
            b.direction_two as direction2,
            b.answer_one as foundsOrigin,
            b.answer_two as estimateMonthlyAmount,
            b.answer_three as profession,
            b.avatar as profilePictureId,
            b.identification_photo as indentificationPictureId,
            b.id_relationship as relationship,
            b.postal_code as postalCode
        from beneficiary b
        inner join information_users_kyc iuk
            on iuk.id_users = b.id_users
        where b.id_users = ?
    `,

    /**
     * Guarda el registro del kyc de un comercio
     * @param {Number} Pid_users int - ide del usuario
     * @param {String} Pwebsite - url del sitio web del comercio
     * @param {String} Pcountry_comercial - país de origen del comercio
     * @param {String} Phonecode_comercial - código del país del origen del comercio
     * @param {String} Pcurrency_comercial - símbolo del país de origen del comercio
     * @param {String} Pprovince_comercial - provincia del origen del comercio
     * @param {String} Pcountry_permanent - país de la ubicación permanente del comercio
     * @param {String} Phonecode_permanent - código del país de la ubicación permanente
     * del comercio
     * @param {String} Pcurrency_permanent - símbolo del país de la ubicación permanenete
     * del comercio
     * @param {String} Pprovince_permanent - provincia permanante del comercio
     * @param {String} Pname_commerce - nombre del comercio
     * @param {String} Ptype_commerce - tipo de comercio
     * @param {String} Pnumber_commerce - número telefónico del comercio
     * @param {String} Pidentification_legal_commerce - código de indentificación
     * @param {Number} Pidentification_legal_photo - tipo de identificación
     * @param {Date} Pdate_incorporation - fecha de incorporación
     * @param {String} Pcity - ciudad
     * @param {String} Pdirection_one - dirección
     * @param {String} Pdirection_two varchar(255),
     * @param {String} Postal_code - código postal
     */
    insertKycEcommerce: `
        call insertion_information_commerce_kyc(
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?
        )
    `,

    /**
     * Registra un beneficiario para un kyc de comercio
     * @param {Number} Pid_users - id del usuario
     * @param {String} Ptitle_charge - Título del cargo que ejerce el beneficiario
     * @param {String} Pname_complete - Nombre completo del beneficiario
     * @param {Date} Pbirthday - Fecha de nacimienti
     * @param {String} Pidentification_personal - Número de la identificaión personal
     * @param {String} Pnumber_passport - Número de identificación del pasaporte
     * @param {String} Pcountry_passport - Nombre País de emisión del pasaporte
     * @param {String} Phonecode_passport - Código telefónico del país de emisón del
     * pasaporte
     * @param {String} Pcurrency_passport - Símbolo del país de emisión del pasaporte
     * @param {String} Pcountry_origin - Nombre País de origin
     * @param {String} Phonecode_origin - Código telefónico del país de origen
     * @param {String} Pcurrency_origin - símbolo del país de origin
     * @param {String} Pprovince - Provincia
     * @param {String} Pcity - Nombre de la ciudad
     * @param {String} Pdirection - Dirección domiciliar
     * @param {String} Ppostal_code - Código postal
     * @param {Number} Ppercentage - Porcentaje de la empresa que posee el beneficiario
     * @param {String} Ptax_identification - Número de identificación tributaria
     * @param {Number} Ppassport_photo - id imagen del pasaporte
     * @param {Number} Pidentification_photo - id imagen de la indentificación personal
     * @param {String} Pemail - correo del beneficiario
     */
    insertKycEcommerceBeneficiary: `
        call insertion_commerce_beneficiary(
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
    `,

    /**
     * Registra el representante legal de un comercio
     * @param {Number} Pdir_or_legal tinyint,
     * @param {Number} Pid_users int,
     * @param {String} Ptitle_charge varchar(255),
     * @param {String} Pname_complete varchar(255),
     * @param {String} Pidentification_personal varchar(45),
     * @param {String} Pnumber_passport varchar(45),
     * @param {String} Pcountry_passport varchar(45),
     * @param {String} Phonecode_passport varchar(10),
     * @param {String} Pcurrency_passport varchar(5),
     * @param {String} Pcountry_origin varchar(45),
     * @param {String} Phonecode_origin varchar(10),
     * @param {String} Pcurrency_origin varchar(5),
     * @param {String} Pdirection varchar(255),
     * @param {String} Ptax_identification varchar(45),
     * @param {String} Phone varchar(45),
     * @param {Number} Pavatar int,
     * @param {Number} Pidentification_photo int,
     * @param {Number} Ppolitically_exposed tinyint,
     * @param {String} Pemail - correo del usuario
     */
    insertKycEcommerceLegalRepresentative: `
        call insertion_commerce_representative_legal(
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )        
    `,

    /**
     * Registra el estimado de transacciones e información final del kyc empresarial
     * @param {Number} Pid_users - id del usuario
     * @param {String} Pnote - Descripción del giro del giro del negocio
     * @param {Number} Pnumber_transactions - Número de  transacciones estimadas
     * que realizará el comercio
     * @param {Number} transactions_usd - Monto en dólares a partir del número de
     * transacciones extimadas
     * @param {Number} Pcertificated - id del archivo de certificado de incorporación
     * @param {Number} Pdocument_direct - id del archivo con la lista de los directores
     * @param {Number} Pdocument - id de archivo con la información acerca de la
     * autenticación y verificación del estatus de los directores designados
     * @param {Number} Pcertificated_legal - id archivo certificado legal
     */
    insertKycEcommerceTradeIncomming: `
        call insertion_trade_income(?, ?, ?, ?, ?, ?, ?, ?)
    `,

    /**
     * Obtiene la información kyc de un comercio a partir del id del usuario
     * @param {Number} id_user
     * @param {Number} id_user
     */
    getKycEcommerceById: `
        select
            ick.id_users as idUser,
            CONCAT(iu.firstname, ' ', iu.lastname) as fullname,
            u.reviewed,
            iu.email,
            ick.website,
            (select c.phone_code from country c where c.id = ick.country_comercial) as commercialCountry,
            ick.province_comercial  as commercialProvince,
            (select c2.phone_code from country c2 where c2.id = ick.country_permanent) as permanentCountry,
            ick.province_permanent as permanentProvince,
            ick.name_commerce as commerceName,
            ick.type_commerce as commerceType,
            ick.number_commerce as commerceTelephone,
            ick.identification_legal_commerce as commerceIdentificationNumber,
            ick.identification_legal_photo as commerceIdentificationPicture,
            ick.date_incorporation as incorporationDate,
            ick.city,
            ick.direction_one as directionOne,
            ick.direction_two as directionTwo,
            ick.postal_code as postalCode,
            ti.note,
            ti.number_transactions as commerceEstimateTransactions,
            ti.transactions_usd as commerceEstimateTransactionsAmount,
            ti.certificated as commerceCertificate,
            ti.document_direct as commerceDirectors,
            ti.document as commerceDirectorsInfo,
            ti.certificated_legal as commerceLegalCertificate
        from information_commerce_kyc ick
        inner join trade_income ti 
            on ti.id_users = ick.id_users
        inner join users u
            on u.id = ick.id_users
        inner join information_user iu
            on iu.id = u.id_information
        where ick.id_users  = ?
    `,

    /**
     * Obtiene los beneficiarios que posee una cuenta con kyc de comercio
     * @param {Number} id_user - id del usuario
     */
    getKycEcommerceBeneficiariesById: `
        select
            cb.title_charge as chargeTitle,
            cb.name_complete as fullname,
            cb.email,
            cb.birthday,
            cb.identification_personal as identificationNumber,
            cb.number_passport as passportNumber,
            (select c.phone_code from country c where c.id = cb.country_passport) as passportEmissionCountry,
            (select c2.phone_code from country c2 where c2.id = cb.country_origin) as originCountry,
            cb.province,
            cb.city,
            cb.direction,
            cb.postal_code as postalCode,
            cb.percentage as participationPercentage,
            cb.tax_identification as identificationTaxNumber,
            cb.identification_photo as identificationPicture,
            cb.passport_photo as passportPicture
        from commerce_beneficiary cb 
        where id_users = ?
    `,

    /**
     * Obtiene el representante legal de un kyc de comercio
     * @param {Number} id_user - id del usuario
     */
    getKycEcommerceLegalRepresentativeById: `
        select
            crl.dir_or_legal as representativeType,
            crl.title_charge as chargeTitle,
            crl.name_complete as fullname,
            crl.identification_personal as identificationNumber,
            crl.number_passport as passportNumber,
            (select c.phone_code from country c where c.id = crl.country_passport) as passportEmissionCountry,
            (select c2.phone_code from country c2 where c2.id = crl.country_origin) as originCountry,
            crl.direction,
            crl.phone as telephoneNumber,
            crl.tax_identification as identificationTaxNumber,
            crl.email,
            crl.identification_photo as identificationPicture,
            crl.avatar as passportPicture,
            crl.politically_exposed as politicallyExposed
        from commerce_representative_legal crl
        where id_users = ?
    `,

    /**
     * Establece como verifado un registri de kyc
     * @param {Number} id_user
     */
    verifyKycInformation: `
        update users set reviewed = 1 where id = ?
    `,

    /**
     * Deshabilita el registro kyc de un usuario
     * @param {Number} id_user - id del usuario
     * @param {Number} kyc_type - tipo de kyc (1=usuario, 2=empresa)
     */
    disableKycInformation: `
        call delete_information_kyc(?, ?)
    `,

    /**
     * Consulta que ingresa nuevo terminos
     *
     * @param {string} name
     * @param {string} text
     */
    insertNewTerm: `INSERT INTO terms_Conditions (name, description) VALUES (?, ?)`,

    /**
     * Actualiza los términos existentes
     * @param {String} description
     * @param {String} name
     */
    updateExistTerm: `UPDATE terms_Conditions set description = ? where name = ?`,

    /**Consulta para obtener todos la lista de terminos */
    getAllTerms: `SELECT * FROM terms_Conditions`,

    /**
     * Consulta que leee los terminos y condiciones por nombre (key)
     *
     * @param {string} name
     */
    getTermByName: `SELECT * FROM terms_Conditions where name = ?`,

    /**
     * Obtiene la lista de los usuarios que se les enviará el reporte de estado
     * de cuneta siempre y cuando cuenten con un plan activo
     * @param {String} cutoffDate - Fecha de corte
     */
    getReportUserDeliveryList: `
        select a.*
        from (select
            vupa.id_user as id,
            vupa.email_user as email,
            vupa.name_user as fullname,
            (
                select count(*)
                from investment i
                where i.id_user = vupa.id_user and i.id_currency = 1
            ) as btc,
            (
                select count(*)
                from investment i
                where i.id_user = vupa.id_user and i.id_currency = 2
            ) as eth
        from view_users_plan_active vupa
        inner join investment i
            on i.id_user = vupa.id_user
        where i.start_date <= ? and vupa.id_user <> 46
        ) a
        group by a.id,a.email,a.fullname,a.btc,a.eth
    `,

    /**
     * Obtiene la info de un usuario que se le enviará el reporte de estado
     * de cuenta siempre y cuando cuenten con un plan activo
     * @param {String} cutoffDate - Fecha de corte
     * @param {String} user_email - correo del usuario
     */
    get getReportUserDeliveryListByEmail() {
        return `
            select * 
            from (${this.getReportUserDeliveryList}) as l
            where l.email = ?
        `
    },

    /**
     * Obtiene la información de la cabecera del reporte de estado de cuenta del
     * usuario
     * @param {Number} id_users - id del usuario
     * @param {String} cutoffDate - fecha de corte
     * @param {Number} id_coin - id de la moneda
     */
    getHeaderReportUser: `
        call header_report_backoffice(?, ?, ?)
    `,

    /**
     * Obtiene la cantidad de referidos con los que cuenta un usuario
     * @param {Number} id_user - id del usuario
     * @param {String} cutoffDate - fecha de corte
     */
    getHeaderReportUserCountReferred: `
        call cant_referred(?, ?)
    `,

    /**
     * Obtiene el reporte de plan de duplicacion de un usuario
     * @param {String} dateReport - Mes y año del reporte
     * @param {Number} idUser - id del usuario
     * @param {Number} coinType - tipo de moneda
     */
    getReportUserDuplicationPlanDetail: `
        call report_duplication_plan_detail(?, ?, ?)
    `,

    /**
     * Obtiene el reporte de pago de comisiones que recibió un sponsor
     * @param {Number} id - id del usuario
     * @param {String} startDate - fecha de inicio de los pagos
     * @param {String} startDate - fecha de inicio de los pagos
     * @param {String} coinCode - código de la moneda
     */
    getReportUserCommissionPayment: `
        select 
            * 
        from view_backoffice_payment_commission 
        where 
            id_sponsor = ? and 
            registration_date >= ? and 
            registration_date <= ? and
            code = ?
    `,

    /**
     * Obtiene la foto del perfil del usuario
     * @param {Number} id - id del usuario
     */
    getUserAvatarPicture: `
        select
            f.name as filename,
            f.type
        from users u 
        inner join information_users_kyc iuk
            on iuk.id_users = u.id
        inner join files f
            on f.id = iuk.avatar 
        where u.id = ?
    `,

    /**
     * Obtiene el id de la foto de perfil del usuario
     * @param {Number} id - id del usuario
     */
    getUserAvatarPictureId: `
        select
            f.id
        from users u 
        inner join information_users_kyc iuk
            on iuk.id_users = u.id
        inner join files f
            on f.id = iuk.avatar 
        where u.id = ?
    `,

    /**
     * Consulta que modifica el estado status de un usuario
     * @param {number} enabled 0/1
     * @param {string} email
     */
    updateUserStatus: `
        UPDATE users SET enabled = ?
        WHERE id_information = (
            SELECT id from information_user WHERE email = ?
        )
    `,

    /**
     * Consulta que inserta el precio de la moneda diario
     * @param date Datetime
     * @param priceBTC float
     * @param priceETH float
     * */
    insertPriceCoinDiary: `
        INSERT INTO coin_price (date_price, eth_price, btc_price)
        VALUES (?, ?, ?)
    `,

    /**
     * Obtiene la lista de la preguntas de control disponibles
     */
    getControlQuestions: `select * from control_question`,

    /**
     * Registra una pregunta de control de usuario
     * @param {Number} id_user - id del usuario
     * @param {Number} id_question - id de la pregunta de control
     * @param {Strig} question_answer - Respuesta de la pregunta
     */
    insertControlUserQuestion: `call insert_answers_users(?, ?, ?)`,

    /**
     * Obtiene la pregunta de control registrada de un usuario
     * @param {Number} id_user - id del usuario
     */
    getControlUserQuestion: `
        select
            ca.id_question,
            cq.question,
            ca.answers as answer
        from control_answers ca
        inner join control_question cq 
            on cq.id = ca.id_question 
        where ca.id_users = ?
    `,

    /**
     * Verifica sí existe un usuario o correo registrado
     * @param {String} username
     * @param {String} email
     */
    checkUsernameAndEmailRegister: `
        select 
            u.id,
            u.username,
            iu.email 
        from users u
        inner join information_user iu
            on iu.id = u.id_information
        where u.username = ? or iu.email = ?
    `,

    /**
     * Consulta que obtiene la fecha de inicio del plan
     * @param {Number} id_investment
     */
    checkStartDateInvestment: `select start_date from investment where id = ?`,

    /**
     * Consulta que busca un correo de root
     * @param {String} email
     */
    checkAdminEmail: `select email from admin_users where email = ?;`,

    /**
     * Consulta que inserta usuario en la tabla de administradores
     * @param {String} email
     * @param {String} password
     * @param {String} name
     */
    insertAdminUser: `insert into admin_users (email, password, name, state) values (?, ?, ?, 1)`,

    /**
     * Consulta para buscar un plan por usuario
     *
     * @param {number} id_currency
     * @param {number} id_user
     */
    getDataInvestment: `SELECT * FROM investment WHERE id = ?`,

    /**
     * Consulta que retorna el monto (USD) invertido en el mes
     * 
     * @param {Number} id_investment
     */
    getTotalAmountUogrades: `
        select monto_usd 
            from validate_plans 
            where id_investment = ?
            and id_type = 2 
            and year(fecha) = year(now())
            and MONTH(fecha) = MONTH(now())
    `,

    /***
     * Consulta que obtiene los upgrades del mes
     */ 
     getTotalMonthUpgrades: `
     select * from validate_plans
     where 
     fecha BETWEEN DATE_SUB(CURDATE(),INTERVAL DAYOFMONTH(CURDATE())-1 DAY) and last_day(CURDATE())
     and id_type = 2
     and id_investment =  ?;
     `
}
