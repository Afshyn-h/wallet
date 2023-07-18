const amqp = require('amqplib/callback_api')
const {
    rabbit_address,
    get_withdrawal_channel,
    send_deposits_channel,
    send_withdrawals_channel
} = require("../config/env");
const {tokenWithdraw} = require("../withdraw");

function getWithdrawals() {
    amqp.connect('amqp://' + rabbit_address, function (error0, connection) {
        if (error0) {
            throw error0
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1
            }
            const queue = get_withdrawal_channel
            channel.assertQueue(queue, {
                durable: true
            })
            console.log(
                ' [*] Waiting for messages in %s. To exit press CTRL+C',
                queue
            )
            channel.consume(
                queue,
                async function (msg) {
                    console.log(' [x] Received %s', msg.content.toString())
                    const message = JSON.parse(msg.content.toString())
                    await tokenWithdraw(
                        message.userId,
                        message.desAddress,
                        message.amount,
                        message.coin,
                        message.referenceId
                    )

                },
                {
                    noAck: true
                }
            )

        })
    })
}

function rabitSendDeposits(txid, coin, address, amount, timeStamp, sender) {
    amqp.connect("amqp://" + rabbit_address, function (error0, connection) {
        if (error0) {
            throw error0
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1
            }
            let queue = send_deposits_channel
            let msg = {
                "txId": txid,
                "coin": coin,
                "address": address,
                "amount": amount,
                "timeStamp": timeStamp,
                "sender": sender
            }

            let msgS = JSON.stringify(msg)
            channel.assertQueue(queue, {
                durable: true
            })

            channel.sendToQueue(queue, Buffer.from(msgS))
            console.log(' [x] Sent %s', msgS)
        })
    })
}

function sendWithdrawals(uniqueId, address, amount, txid, coin, confirm, timeStamp, referenceId) {
    amqp.connect("amqp://" + rabbit_address, function (error0, connection) {
        if (error0) {
            throw error0
        }
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1
            }
            let queue = send_withdrawals_channel

            let msg = {
                "userId": uniqueId,
                "address": address,
                "amount": amount,
                "txId": txid,
                "coin": coin,
                "confirm": confirm,
                "timeStamp": timeStamp,
                "referenceId": referenceId
            }

            let msgS = JSON.stringify(msg)
            channel.assertQueue(queue, {
                durable: true
            })

            channel.sendToQueue(queue, Buffer.from(msgS))
            console.log(' [x] Sent %s', msgS)
        })
    })
}

module.exports = {
    getWithdrawals, rabitSendDeposits, sendWithdrawals
}