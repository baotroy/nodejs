const CronJob           = require('cron').CronJob;
const Shell = require('shelljs');
const amqp = require("amqplib/callback_api");
require("dotenv").config();
const rabbitUserName = process.env.RABBIT_USERNAME;
const rabbitPassword = process.env.RABBIT_PASSWORD;
const rabbitHost = process.env.RABBIT_HOST;
const rabbitPort = process.env.RABBIT_PORT;
const rabbitConnectUrl = `amqp://${rabbitUserName}:${rabbitPassword}@${rabbitHost}:${rabbitPort}`;
console.log("rabbitConnectUrl ", rabbitConnectUrl);
let channel = null;
amqp.connect(rabbitConnectUrl, function(err, conn) {
    conn.createChannel(function(err, ch) {
        channel = ch;
    });
});

function cronFunction() {
    if (channel) {
        const q = 'txQueue';
        channel.assertQueue(q, {durable: false}, function(err, ok) {
            if (ok.messageCount) {
                if (ok.messageCount > 200) {
                    // restart txworker
                    Shell.exec('pm2 restart tx-worker', function(code, output) {
                        console.log('Restarting tx-worker...');
                        console.log('Exit code:', code);
                        console.log('Program output:', output);
                    });
                }
            }
        });
    }
}
const cront = new CronJob('*/5 * * * * *', async () => {
    cronFunction();
}, null, true);
cront.start();