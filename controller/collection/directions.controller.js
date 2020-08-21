const express = require("express")
const router = express.Router()


// import constants and functions
const { WALLETSAPP } = require("../../configuration/constant.config")

router.get("/", (_, res) => {
    res.send({ ...WALLETSAPP })
})

module.exports = router