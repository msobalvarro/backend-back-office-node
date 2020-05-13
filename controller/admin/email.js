const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const Auth = require("../../middleware/auth")

// Mysql
const { getEMails } = require("../queries")
const query = require("../../config/query")

const checkAllData = [Auth]

router.get("/all", (req, res) => {
    try {        
        query(getEMails, [], response => {
            res.send(response)
        })
    } catch (error) {
        res.send({
            error: true,
            message: error.toString()
        })
    }
})

module.exports = router