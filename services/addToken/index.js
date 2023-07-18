//const Web3 = require('web3');
//const Contract = require('web3-eth-contract');
//const {web3_ws} = require("../../config/env");
const { insertToTokens} = require("../../db");
const {subscribeForToken, contracts, tokenAddresses} = require("../../watcher");
//Contract.setProvider(web3_ws);
//const web3 = new Web3(web3_ws)


async function addNewToken(req, res) {
    let coin = req.params.coin;
    let contractAddress = req.params.contractAddress;
    try {
        insertToTokens(contractAddress, coin);
        contracts.push({
            contractAddress: contractAddress, coin: coin
        })
        tokenAddresses.push(contractAddress);
        await subscribeForToken(contractAddress, coin);

        res.status(200).json({msg: `${coin} added`})
    } catch (e) {
        console.log(e)
        res.status(500).json({msg: e})
    }
}




module.exports = {
    addNewToken
}