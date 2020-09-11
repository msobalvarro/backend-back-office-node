const mysql = require('mysql')

const { DBHOST, DBNAME, DBUSER, DBPASS } = require("./vars.config")
/*
* Constante que crea una cadena de conexion
*/
const pool = mysql.createPool({
    connectionLimit: 5,
    connectTimeout: 10000,
    database: DBNAME,
    host: DBHOST,
    user: DBUSER,
    password: DBPASS
})

const run = (sqlScript = '', params = []) => new Promise((resolve, reject) => {
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

module.exports = { run }