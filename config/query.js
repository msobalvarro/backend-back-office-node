const mysql = require('mysql')
const writeError = require('../logs/write')

// require('dotenv').config()
const { DBHOST, DBNAME, DBUSER, DBPASS } = process.env


const withPromises = (queryScript = '', params = []) => {
    return new Promise((resolve, reject) => {
        query(queryScript, params, (response) => {
            resolve(response)
        }).catch(reason => reject(reason))
    })
}

/**Function extends database connection functions */
const query = async (str = '', params = [], callback = (r = {}) => { }) => {

    try {
        const conection = await mysql.createConnection({
            database: DBNAME,
            host: DBHOST,
            user: DBUSER,
            password: DBPASS
        })

        /**Consult */
        await conection.query(str, params, (errQuery, results) => {
            if (errQuery) {
                throw `query.js - error in execute query | ${errQuery.sqlMessage}`
            } else {
                callback(results)
            }
        })

        conection.end(
            (errEnd) => {
                if (errEnd) {
                    throw `query.js - error in close conection | ${errEnd}`
                }
            }
        )
    } catch (error) {
        writeError(error.toString())
    }
}

query.withPromises = withPromises

module.exports = query