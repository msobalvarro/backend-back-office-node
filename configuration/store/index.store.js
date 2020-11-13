const { createStore, combineReducers } = require("redux")

// import reducers
const prices = require("./reducers/prices.reducer")
const terms = require("./reducers/terms.reducer")

// creamos el reducer
const reducers = combineReducers({ prices, terms })

// generamos el store
module.exports = createStore(reducers)