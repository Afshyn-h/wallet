const express = require('express')
const Router = express.Router();
const bodyParser = require("body-parser");
const {getAddress, getAddress_admin, generateMnemonic} = require("../generateAddress");
const {addNewToken} = require("../services/addToken");
const {getFee} = require("../services/fee");
const {provider} = require("../watcher");
let jsonParser = bodyParser.json()

Router.post('/address/user', jsonParser, function(req, res){
    getAddress(req, res);
})

Router.get('/generateMnemonic', function(req, res){
    generateMnemonic(req, res);
})

Router.get('/getFee', async function(req, res){
    await getFee(req, res);
})

Router.get('/provider',  function(req, res){
    provider(req, res);
})

Router.post('/address/admin', jsonParser, function(req, res){
    getAddress_admin(req, res);
})

Router.get('/add-token/:coin/:contractAddress', async function(req, res){
    await addNewToken(req, res)
})

module.exports = Router;
