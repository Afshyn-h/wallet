const {web3_http, db_url, mnemonic2, checking_confirmations} = require("../config/env");
const Contract = require('web3-eth-contract');
const Web3 = require('web3');
const {abi} = require("../config/abi");
const web3 = new Web3(web3_http)
Contract.setProvider(web3_http);

const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://' + db_url

const {addressGetter} = require("../generateAddress");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function tokenWithdraw(id, desAddress, amount, coin, referenceId) {
    const {sendWithdrawals} = require("../rabbit");
    const {insertToWithdrawals} = require("../db");
    Contract.setProvider(web3_http);
    let contractAddress;
    let amountInWei = web3.utils.toWei(`${amount}`, 'ether');
    //amountInWei = bigInt(amountInWei)
    let tokenContract;
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        const dbo = db.db("mydb");
        dbo.collection("tokens").findOne({coin: coin}, function (err, result) {
            if (err) throw err;
            if (result) {
                contractAddress = result.contractAddress;
                tokenContract = new Contract(abi, contractAddress)
            }
            db.close();
        });

    });
    let hotWalletAddress;
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        const dbo = db.db("mydb");
        dbo.collection("adminWallets").find({}).toArray(async function (err, result) {
            if (err) throw err;

            if (result) {
                for (let i = 0; i < result.length; i++) {
                    hotWalletAddress = result[i].address;
                }
            }
            db.close();
        });

    });

    await delay(2000)

    let data = tokenContract.methods.transfer(desAddress, amountInWei).encodeABI();
    let gas = await tokenContract.methods.transfer(desAddress, amountInWei).estimateGas({from: hotWalletAddress})
    let gasPrice = await web3.eth.getGasPrice();
    let nonce = await web3.eth.getTransactionCount(hotWalletAddress)
    let getPRV = await addressGetter(hotWalletAddress)
    let wallet = getPRV.prv
    console.log("nonce", nonce)
    let transactionObject = {
        from: hotWalletAddress, gasPrice: gasPrice, gas: gas, to: contractAddress, value: '0x', data: data, chainId: 97
        //nonce: nonce
    };
    const confirm = false
    let sign = await web3.eth.accounts.signTransaction(transactionObject, `0x${wallet}`)

    let send = await web3.eth.sendSignedTransaction(sign.rawTransaction)

    const blockData = await web3.eth.getBlock(send.blockNumber)
    const timeStamp = blockData.timestamp

    sendWithdrawals(id, desAddress, amount, send.transactionHash, coin, confirm, timeStamp, referenceId)
    insertToWithdrawals(id, desAddress, amount, send.transactionHash, coin, send.blockNumber, confirm, timeStamp, referenceId)
}

function updateWithdrawalsConfirm(txid) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err
        const dbo = db.db('mydb')
        const myquery = {txid: txid}
        const newvalues = {$set: {confirm: true}}
        dbo
            .collection('withdrawals')
            .updateOne(myquery, newvalues, function (err, res) {
                if (err) throw err;
                console.log("1 document updated");
                db.close();
            })
    })
}


function checkingConfirmationsforWithdrawals() {
    const {sendWithdrawals} = require("../rabbit");
    Contract.setProvider(web3_http);
    MongoClient.connect(url, function (err, db) {
        if (err) throw err
        const dbo = db.db('mydb')

        dbo
            .collection('withdrawals')
            .find({confirm: false})
            .toArray(function (err, result) {
                if (err) throw err
                // console.log(result)
                try {
                    if (result) {
                        result.forEach(async (elements) => {

                            let latestBlock = await web3.eth.getBlockNumber()
                            latestBlock = parseInt(latestBlock)
                            let txBlockNumber = elements.blockNumber
                            txBlockNumber = parseInt(txBlockNumber)
                            let confirmation = latestBlock - txBlockNumber
                            confirmation = parseInt(confirmation)
                            let checkingConfirmations = checking_confirmations
                            checkingConfirmations = parseInt(checkingConfirmations)
                            if (confirmation > checkingConfirmations) {
                                const confirm = true;
                                sendWithdrawals(
                                    elements.id,
                                    elements.address,
                                    elements.amount,
                                    elements.txid,
                                    elements.coin,
                                    confirm,
                                    elements.timeStamp,
                                    elements.referenceId
                                )
                                updateWithdrawalsConfirm(elements.txid)
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
    tokenWithdraw, checkingConfirmationsforWithdrawals
}