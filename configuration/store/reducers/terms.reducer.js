const _ = require("lodash")
const { setTerms, deleteTerm } = require("../actions.json")

const INITIAL_STATE = {}

module.exports = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case setTerms: {
            return action.payload
        }

        case deleteTerm: {
            return _.remove(state, term => term === action.payload)
        }
        
        default: {
            return state
        }
    }
}