const mysql = require('mysql')
const writeError = require('../logs/write.config')

const { DBHOST, DBNAME, DBUSER, DBPASS } = require("./vars.config")


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
            // socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
            port: 3306,
            host: DBHOST,
            user: DBUSER,
            password: DBPASS
        })

        await conection.connect(async(err) => {
            if (err) {
                throw `query.js - error in connect database | ${err}`
            }

            /**Consult */
            await conection.query(str, params, (errQuery, results) => {
                if (errQuery) {
                    console.log('ERROR: ' + errQuery)
                    throw `query.js - error in execute query | ${errQuery.sqlMessage}`
                } else {
                    callback(results)
                }
            })
        })


        // conection.end(
        //     (errEnd) => {
        //         if (errEnd) {
        //             throw `query.js - error in close conection | ${errEnd}`
        //         }
        //     }
        // )
    } catch (error) {
        writeError(error.toString())
    }
}

query.withPromises = withPromises

module.exports = query