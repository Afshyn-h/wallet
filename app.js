const express = require('express')
const Router = require("./routers");
const {createCollections, findUsersWalletsAtStart, findAdminWalletsAtStart, findTokensAtStart} = require("./db");
const {checkingConfirmationsJob, gettingAddressJob, addresses} = require("./jobs");
const {subscribeForTokensAtStart} = require("./watcher");
const {getWithdrawals} = require("./rabbit");
const app = express()
app.use('/', Router);

const port = 3000;


//// sentry-start

const Sentry = require("@sentry/node");
// or use es6 import statements
// import * as Sentry from '@sentry/node';

const Tracing = require("@sentry/tracing");
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

Sentry.init({
    dsn: "https://6d4cea12a0ec4948af10e102224952b1@sentry.hupadstore.ir//7",

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});

const transaction = Sentry.startTransaction({
    op: "test",
    name: "My First Test Transaction",
});

setTimeout(() => {
    try {
        foo();
    } catch (e) {
        Sentry.captureException(e);
    } finally {
        transaction.finish();
    }
}, 99);

////sentry-end
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

app.listen(port, "127.0.0.1",async () => {
    console.log(`app started at port ${port}`);
    createCollections();
    checkingConfirmationsJob.start();
    gettingAddressJob.start()
    getWithdrawals()
    await delay(3500)
    subscribeForTokensAtStart()
})