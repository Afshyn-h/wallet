const {tokenAddresses, adminAddreses} = require("../../watcher");
const {abi} = require("../../config/abi");
const {web3_http, db_url} = require("../../config/env");
const Contract = require('web3-eth-contract');
const Web3 = require("web3");
const web3 = new Web3(web3_http)
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://" + db_url;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function getAdminAddress() {
    const contractAddress = tokenAddresses[0]
    let tokenContract = new Contract(abi, contractAddress)

    let adminAddress;

    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        const dbo = db.db("mydb");
        dbo.collection("adminWallets").find({}).toArray(async function (err, result) {
            if (err) throw err;
            if (result) {
                for (let i = 0; i < result.length; i++) {
                    let balance = await tokenContract.methods.balanceOf(result[i].address).call();
                    if (balance > 0) {
                        adminAddress = result[i].address
                    }
                }
            }
            db.close();
        });
    });
    await delay(1000)
    return {address: adminAddress};
}

async function getFee(req, res) {
    Contract.setProvider(web3_http);
    const contractAddress = tokenAddresses[0]
    let tokenContract = new Contract(abi, contractAddress)
    const from = (await getAdminAddress()).address
    let gasPrice = await web3.eth.getGasPrice();
    await delay(1000)
    const gas = await tokenContract.methods.transfer("0x8c480C50Fa85468bbf8576aE8e09336532916414", 1).estimateGas({from: from})
    gasPrice = web3.utils.fromWei(`${gasPrice}`, 'ether');
    const Fee = gas * gasPrice
    res.status(200).json({amount: Fee, coin: "BNB"})
}

module.exports = {
    getFee
}