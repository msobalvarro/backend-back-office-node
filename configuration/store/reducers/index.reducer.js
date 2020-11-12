const { combineReducers } = require("redux")

// import reducers
const prices = require("./prices.reducer")

module.exports = combineReducers({ prices })