const {db_url, mnemonic} = require("../config/env");
const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://' + db_url

function insertToWallet(address, mnemonic, path, userId) {
    MongoClient.connect(url, function (err, db) {
        let dbo = db.db('mydb')
        let myobj = {address: address, mnemonic: mnemonic, path: path, userId: userId}
        dbo.collection('usersWallets').insertOne(myobj, function (err, res) {
            if (err) throw err
            console.log(`1 document inserted, ${myobj}`)
            db.close()
        })
    })
}

function insertToWallet_admin(address, mnemonic, path, index) {
    MongoClient.connect(url, function (err, db) {
        let dbo = db.db('mydb')
        let myobj = {address: address, mnemonic: mnemonic, path: path, index: index}
        dbo.collection('adminWallets').insertOne(myobj, function (err, res) {
            if (err) throw err
            console.log(`1 document inserted, ${myobj}`)
            db.close()
        })
    })
}

function insertToDeposits(txid, address, coin, amount, process, blockNumber, timeStamp, from_address) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err
        let dbo = db.db('mydb')
        let myobj = {
            txid: txid,
            address: address,
            coin: coin,
            amount: amount,
            process: process,
            blockNumber: blockNumber,
            timeStamp: timeStamp,
            sender: from_address
        }
        dbo.collection('deposits').insertOne(myobj, function (err, res) {
            if (err) throw err
            console.log(`1 document inserted, ${myobj} `)
            db.close()
        })
    })
}

function insertToTokens(address, name) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var myobj = {contractAddress: address, coin: name};
        dbo.collection("tokens").insertOne(myobj, function (err, res) {
            if (err) throw err;
            console.log(`1 document inserted, ${myobj}`);
            db.close();
        });
    });
}

function insertToWithdrawals(id, address, amount, txid, coin, blockNumber, confirm, timeStamp, referenceId) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var myobj = {
            id: id,
            address: address,
            amount: amount,
            txid: txid,
            coin: coin,
            blockNumber: blockNumber,
            confirm: confirm,
            timeStamp: timeStamp,
            referenceId: referenceId
        };
        dbo.collection("withdrawals").insertOne(myobj, function (err, res) {
            if (err) throw err;
            console.log(`1 document inserted, ${myobj}`);
            db.close();
        });
    });
}

function createCollections() {
    MongoClient.connect(url, function (err, db) {

        console.log('Database created!')
        let dbo = db.db('mydb')
        dbo.createCollection('usersWallets', function (err, res) {
            console.log('usersWallets Collection created!')
        })
        dbo.createCollection('adminWallets', function (err, res) {
            console.log('adminWallets Collection created!')
        })
        dbo.createCollection('tokens', function (err, res) {
            console.log('tokens Collection created!')
        })
        //create pps collection
        dbo.createCollection('deposits', function (err, res) {

            console.log('deposits Collection created!')
        })

        //create transactions collection
        dbo.createCollection('withdrawals', function (err, res) {

            console.log('withdrawals Collection created!')
        })

    })
}

module.exports = {
    createCollections, insertToWallet, insertToWallet_admin, insertToDeposits, insertToTokens, insertToWithdrawals
}