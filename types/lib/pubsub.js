"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PubSub = require("@google-cloud/pubsub");
var chalk = require("chalk");
var chai_1 = require("chai");
var fs_1 = require("fs");
var config;
var pubsub;
var testData = [];
before(function () {
    var configPath = '.config/config.json';
    // get config
    console.log(chalk.green('reading configuration...'));
    config = JSON.parse(fs_1.readFileSync(configPath, 'utf8'));
    pubsub = new PubSub({
        projectId: config['project_id']
    });
    process.env.DATASTORE_EMULATOR_HOST = 'localhost:8304';
    var mockData = JSON.parse(fs_1.readFileSync('test_data/mock-message-data.json', 'utf8'));
    for (var _i = 0, mockData_1 = mockData; _i < mockData_1.length; _i++) {
        var entry = mockData_1[_i];
        testData.push({
            firstName: entry.first_name,
            email: entry.email,
            bitcoinAddress: entry.bitcoin_address
        });
    }
});
describe('PubSub', function () {
    describe('#createTopic', function () {
        it('should create topic', function () {
            var topic = pubsub.topic('test');
            return topic.get({ autoCreate: true })
                .then(function (data) {
                var topic = data[0];
                return topic.exists().then(function (d) { return chai_1.expect(d[0]).to.be.true; });
            });
        });
    });
    describe('#publish', function () {
        it('should publish messages', function () {
            var topic = pubsub.topic('test');
            return topic.publish(testData);
        });
    });
    describe('#pull', function () {
        it('should pull messages successfully', function () {
            var topic = pubsub.topic('test');
            return topic.subscribe('subTest', { autoAck: true }).then(function (data) {
                var sub = data[0];
                var messages = [];
                function pullMessages(numMessages, messages) {
                    messages = messages || [];
                    return sub.pull({
                        maxResults: 1000,
                        returnImmediately: true
                    }).then(function (data) {
                        var _messages = data[0];
                        if (_messages.length > 0 && numMessages > 0) {
                            messages = messages.concat(_messages);
                            return pullMessages(numMessages - _messages.length, messages);
                        }
                        return messages;
                    });
                }
                return pullMessages(1000).then(function (messages) { return chai_1.expect(messages.length).to.equal(1000); });
            });
        });
        it('should stream messages successfully', function (done) {
            var topic = pubsub.topic('test');
            topic.subscribe('subTest2').then(function (data) {
                var sub = data[0];
                var count = 0;
                var doneFlag = false;
                sub.on('error', function (err) { return done(err); });
                sub.on('message', function (message) {
                    message.ack();
                    count++;
                    if (count >= 1000 && doneFlag !== true) {
                        doneFlag = true;
                        done();
                    }
                });
            });
        });
    });
});
//# sourceMappingURL=pubsub.js.map