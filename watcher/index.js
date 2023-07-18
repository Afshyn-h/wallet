const {abi} = require("../config/abi");

const Web3 = require('web3');

const Contract = require('web3-eth-contract');
const {db_url, checking_confirmations, web3_ws, web3_http} = require("../config/env");
const {rabitSendDeposits} = require("../rabbit");
const {insertToDeposits} = require("../db");
const web3 = new Web3(web3_http)
let tokenAddresses = [];
let contracts = [];
const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://' + db_url
const Web3WsProvider = require('web3-providers-ws');

const options = {
    timeout: 5000, // ms

    clientConfig: {
        // Useful to keep a connection alive
        keepalive: true,
        keepaliveInterval: 6000000 // ms
    },

    // Enable auto reconnection
    reconnect: {
        auto: true,
        delay: 1000, // ms
        maxAttempts: 5000,
        onTimeout: true
    }
};

const ws = new Web3WsProvider(web3_ws, options);


let addresses = [];
let adminAddreses = [];

function provider(req, res) {
    const out = web3.currentProvider
    console.log("out", out)
}

function gettingAddresses() {
    let tempAdd = []
    let temAdd2 = []
    MongoClient.connect(url, function (err, db) {
        if (err) throw err

        var dbo = db.db('mydb')
        dbo
            .collection('usersWallets')
            .find({})
            .toArray(function (err, result) {
                if (err) throw err
                if (result) {
                    result.forEach(elements => {
                        tempAdd.push(elements.address)
                    })
                }
                db.close()
            })

    })
    MongoClient.connect(url, function (err, db) {
        if (err) throw err

        var dbo = db.db('mydb')
        dbo
            .collection('adminWallets')
            .find({})
            .toArray(function (err, result) {
                if (err) throw err
                if (result) {
                    result.forEach(elements => {
                        temAdd2.push(elements.address)
                    })
                }

                db.close()
            })

    })
    setTimeout(function () {
        addresses = tempAdd;
        adminAddreses = temAdd2;
    }, 1000);
}


function subscribeForToken(address, coin) {
    Contract.setProvider(ws);
    console.log('as')
    const contract = new Contract(abi, address);
    console.log("address", address)
    contract.events.Transfer({}, function (error, event) {
        if (error) {
            console.log(error)
        }

    })
        .on("connected", function (subscriptionId) {
            console.log(subscriptionId);

        })
        .on('data', async function (event) {
            let from_address = event.returnValues.from;
            let to_address = event.returnValues.to;
            console.log(event)
            if (!adminAddreses.includes(from_address) && addresses.includes(to_address)) {
                try {
                    const blockData = await web3.eth.getBlock(event.blockNumber)
                    let amountInEther = web3.utils.fromWei(`${event.returnValues.value}`, 'ether')
                    let txid = event.transactionHash
                    let process = false;
                    let blockNumber = event.blockNumber
                    const timeStamp = blockData.timestamp
                    insertToDeposits(txid, to_address, coin, amountInEther, process, blockNumber, timeStamp, from_address)
                }catch (e) {
                    
                }

            }
        })
        .on('changed', function (event) {
            //console.log("changed", event)
            // remove event from local database
        })
        .on('error', function (error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            //console.log("error", error, receipt)
        });

}

function subscribeForTokensAtStart() {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        const dbo = db.db("mydb");
        dbo.collection("tokens").find({}).toArray(function (err, result) {
            if (err) throw err;
            if (result) {
                for (let i = 0; i < result.length; i++) {
                    subscribeForToken(result[i].contractAddress, result[i].coin)
                    contracts.push({
                        contractAddress: result[i].contractAddress, coin: result[i].coin, network: result[i].network
                    })
                    tokenAddresses.push(result[i].contractAddress);
                }
            }

            db.close();
        });
    });
}

function updateDepositProcess(txid, txBlockNumber) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err
        const dbo = db.db('mydb')
        const myquery = {txid: txid}
        const newvalues = {$set: {process: true, blockNumber: txBlockNumber}}
        dbo
            .collection('deposits')
            .updateOne(myquery, newvalues, function (err, res) {
                if (err) throw err;
                console.log("1 document updated");
                db.close();
            })
    })
}


function checkingConfirmations() {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err
        const dbo = db.db('mydb')

        dbo
            .collection('deposits')
            .find({process: false})
            .toArray(function (err, result) {
                if (err) throw err
                // console.log(result)
                try {
                    if (result) {
                        result.forEach(async (elements) => {
                            let detail = await web3.eth.getTransaction(elements.txid)
                            let latestBlock = await web3.eth.getBlockNumber()
                            latestBlock = parseInt(latestBlock)
                            let txBlockNumber = detail.blockNumber
                            txBlockNumber = parseInt(txBlockNumber)
                            let confirmation = latestBlock - txBlockNumber
                            confirmation = parseInt(confirmation)
                            let checkingConfirmations = checking_confirmations
                            checkingConfirmations = parseInt(checkingConfirmations)
                            if (confirmation > checkingConfirmations) {
                                rabitSendDeposits(
                                    elements.txid,
                                    elements.coin,
                                    elements.address,
                                    elements.amount,
                                    elements.timeStamp,
                                    elements.sender
                                )
                                updateDepositProcess(elements.txid, txBlockNumber)
                            }
                        })
                    }
                } catch (e) {
                }
                db.close()
            })
    })
}


module.exports = {
    subscribeForToken,
    checkingConfirmations,
    gettingAddresses,
    subscribeForTokensAtStart,
    tokenAddresses,
    contracts,
    adminAddreses, provider
}