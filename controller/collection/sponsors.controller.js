const express = require('express')
const router = express.Router()
const log = require('../../logs/write.config')

// Sql transaction
const sql = require("../../configuration/sql.config")
const { getAllSponsored } = require("../../configuration/queries.sql")

// import middleware
const { auth } = require('../../middleware/auth.middleware')

// import constants and functions
const _ = require("lodash")

/**Return investment plans by id */
router.get('/:id', auth, async (req, res) => {
    try {
        const { id_user: id } = req.user

        // ejecutamos la consulta para obtener los datos de 
        const response = await sql.run(getAllSponsored, [id])

        // 
        const data = []

        for (let i = 0; i < response[0].length; i++) {
            const element = response[0][i]

            const dataObject = {
                ...element,
                comission: _.floor((element.amount * element.fee_sponsor), 8),
            }

            data.push(dataObject)
        }

        res.send(data)

    } catch (message) {
        /**Error information */
        log(`sponsor.controller.js | ${message.toString()}`)

        res.send({ error: true, message })
    }
})

module.exports = router