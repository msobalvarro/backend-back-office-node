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

const run = (queryScript = '', params = []) => new Promise((resolve, reject) => {
    pool.query(queryScript, params, (err, resultsCallback) => {
        // verificamos si hay errro en la query
        if (err) {
            reject(err.message)
        } else {
            // ejecutamos un `success`
            resolve(resultsCallback)
        }
    })
})

module.exports = { run }