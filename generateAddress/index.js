const bip39 = require("bip39");
const HDKey = require('hdkey');
const {mnemonic, mnemonic2, db_url, web3_http, token} = require("../config/env");
const {insertToWallet, insertToWallet_admin} = require("../db");
const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://' + db_url
const Web3 = require('web3');
const web3 = new Web3(web3_http)

function generateMnemonic(req, res) {
    const mnemonicPhrase = bip39.generateMnemonic()
    res.status(200).json({mnemonic: mnemonicPhrase})
}

function getAddress(req, res) {
    const userId = req.body.userId;
    const headerToken = req.header('token');
    if (headerToken == token) {
        if (Number.isInteger(userId)) {
            let seed = bip39.mnemonicToSeedSync(mnemonic).toString('hex')
            const hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
            const childkey = hdkey.derive(`m/44'/60'/0'/0/${userId}`)
            const privateKEY = childkey.privateKey.toString("hex")
            const acc = web3.eth.accounts.privateKeyToAccount(privateKEY)
            const address = acc.address

            insertToWallet(address, mnemonic, `m/44'/60'/0'/0/${userId}`, userId);
            res.status(200).json({
                address: address, userId: userId
            })
        } else {
            res.status(400).json({
                msg: "userId is not unsigned integer!"
            })
        }
    }else{
        res.status(400).json({
            msg: "token is wrong!"
        })
    }
}

function getAddress_admin(req, res) {
    const id = req.body.id;

    if (Number.isInteger(id)) {
        let seed = bip39.mnemonicToSeedSync(mnemonic2).toString('hex')
        const hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
        const childkey = hdkey.derive(`m/44'/60'/0'/0/${id}`)
        const privateKEY = childkey.privateKey.toString("hex")
        const acc = web3.eth.accounts.privateKeyToAccount(privateKEY)
        const address = acc.address

        insertToWallet_admin(address, mnemonic, `m/44'/60'/0'/0/${id}`, id);
        res.status(200).json({
            address: address, id: id
        })
    } else {
        res.status(400).json({
            msg: "id is not unsigned integer!"
        })
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function addressGetter(admin_wallet) {
    let id;
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        const dbo = db.db("mydb");
        dbo.collection("adminWallets").findOne({address: admin_wallet}, function (err, result) {
            if (err) throw err;
            if (result) {
                id = result.index
            }
            db.close();
        });
    });
    await delay(1000)
    let seed = bip39.mnemonicToSeedSync(mnemonic2).toString('hex')
    const hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
    const childkey = hdkey.derive(`m/44'/60'/0'/0/${id}`)
    const privateKEY = childkey.privateKey.toString("hex")

    return {prv: privateKEY}

}

module.exports = {
    getAddress, getAddress_admin, addressGetter, generateMnemonic
}