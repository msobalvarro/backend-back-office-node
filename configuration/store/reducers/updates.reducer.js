// const _ = require("lodash")
const { setUpdates, reportTrading, reportPayment } = require("../actions.json")

const INITIAL_STATE = {
    TRADING: {
        BTC: {
            date: null,
            author: null
        },
        ETH: {
            date: null,
            author: null
        }
    },

    PAYMENT: {
        BTC: {
            date: null,
            author: null
        },
        ETH: {
            date: null,
            author: null
        }
    }
}

module.exports = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case setUpdates: {
            return action.payload
        }

        case reportTrading: {
            return {
                ...state,
                TRADING: {
                    ...state.TRADING,
                    [action.coin]: action.payload
                }
            }
        }

        case reportPayment: {
            return {
                ...state,
                PAYMENT: {
                    ...state.PAYMENT,
                    [action.coin]: action.payload
                }
            }
        }

        default: {
            return state
        }
    }
}