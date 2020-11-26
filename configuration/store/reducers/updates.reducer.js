// const _ = require("lodash")
const { setUpdates } = require("../actions.json")

const INITIAL_STATE = {}

module.exports = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case setUpdates: {
            return action.payload
        }

        default: {
            return state
        }
    }
}