const router = require('express').Router()

// Import sql
const sql = require('../../configuration/sql.config')
const {
    getControlQuestions
} = require('../../configuration/queries.sql')

// Import log
const log = require('../../logs/write.config')

/**
 * Retorna la lista de las preguntas de control disponibles
 */
router.get('/', async (_, res) => {
    try {
        const response = await sql.run(getControlQuestions)

        res.send(response)
    } catch (message) {
        log(`control-questions.controller.js | error on get questions list | ${message}`)

        res.send({
            error: true,
            message
        })
    }
})

module.exports = router