const { setPrices } = require("../actions.json")

const INITIAL_STATE = {}

module.exports = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case setPrices: {
            return action.payload
        }

        default: {
            return state
        }
    }
}