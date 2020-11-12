const { createStore } = require("redux")

const reducers = require("./reducers/index.reducer")


module.exports = createStore(reducers)