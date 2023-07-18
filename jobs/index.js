const {checkingConfirmations, gettingAddresses} = require("../watcher");
const {checkingConfirmationsforWithdrawals} = require("../withdraw");
const CronJob = require('cron').CronJob;

const checkingConfirmationsJob = new CronJob(`*/2 * * * *`, function () {
    console.log('You will this message every 2 mins for checking confirmations')
    checkingConfirmations();
    checkingConfirmationsforWithdrawals();
})

const gettingAddressJob = new CronJob('*/3 * * * * *', function () {
    console.log('You will this message every 3 seconds for getting addresses')
    gettingAddresses()

})


module.exports = {
    checkingConfirmationsJob, gettingAddressJob
}