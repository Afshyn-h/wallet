const { resolve } = require('path')

require('dotenv').config({ path: resolve(__dirname, '../.env') })

let mnemonic = process.env.MNEMONIC
let mnemonic2 = process.env.MNEMONIC2
let db_url = process.env.DB_URL
let rabbit_address = process.env.RABBIT_ADDRESS
let get_withdrawal_channel = process.env.GET_WITHDRAWAL_CHANNEL
let send_withdrawals_channel = process.env.SEND_WITHDRAWALS_CHANNEL
let send_deposits_channel = process.env.SEND_DEPOSITS_CHANNEL
let web3_ws = process.env.WEB3_WS
let web3_http = process.env.WEB3_HTTP
let checking_confirmations = process.env.CHECKING_CONFIRMATIONS
let token = process.env.TOKEN

module.exports = {
    mnemonic, db_url, mnemonic2, rabbit_address, get_withdrawal_channel, web3_http, web3_ws,
    checking_confirmations, send_deposits_channel, send_withdrawals_channel, token
}