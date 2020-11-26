const { createStore, combineReducers } = require("redux")

// import reducers
const prices = require("./reducers/prices.reducer")
const terms = require("./reducers/terms.reducer")
const updates = require("./reducers/updates.reducer")
const clients = require("./reducers/clients.reducer")

// creamos el reducer
const reducers = combineReducers({ prices, terms, updates, clients })

// generamos el store
module.exports = createStore(reducers)