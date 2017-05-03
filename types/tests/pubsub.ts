import * as PubSub from '@google-cloud/pubsub';
import * as chalk from 'chalk';
import { expect } from 'chai';
import { readFileSync } from 'fs';

interface MockMessage {
    firstName: string;
    email: string;
    bitcoinAddress: string;
}

let config: any;
let pubsub: PubSub;
let testData: MockMessage[] =  [];
before(function () {
    let configPath = '.config/config.json';
    // get config
    console.log(chalk.green('reading configuration...'));
    config = JSON.parse(readFileSync(configPath, 'utf8'));

    pubsub = new PubSub({
        projectId: config['project_id']
    });
    process.env.DATASTORE_EMULATOR_HOST= 'localhost:8304';

    let mockData = JSON.parse(readFileSync('test_data/mock-message-data.json', 'utf8'));
    for (let entry of mockData) {
        testData.push({
            firstName: entry.first_name,
            email: entry.email,
            bitcoinAddress: entry.bitcoin_address
        } as MockMessage);
    }
});

describe('PubSub', function() {
    describe('#createTopic', function() {
        it('should create topic', function() {
            let topic = pubsub.topic('test');
            return topic.get({ autoCreate: true })
                .then(data => {
                    let topic = data[0];
                    return topic.exists().then(d => expect(d[0]).to.be.true);
                });
        });
    });

    describe('#publish', function() {
        it('should publish messages', function() {
            let topic = pubsub.topic('test');
            return topic.publish(testData);
        });
    });

    describe('#pull', function() {
        it('should pull messages successfully', function() {
            let topic = pubsub.topic('test');
            return topic.subscribe('subTest', { autoAck: true }).then(data => {
                let sub = data[0];
                let messages: MockMessage[] = [];

                function pullMessages<T>(numMessages: number, messages?: T[]): Promise<T[]> {
                    messages = messages || [];
                    return sub.pull<T>({
                        maxResults: 1000,
                        returnImmediately: true
                    }).then(data => {
                        let _messages = data[0];
                        if (_messages.length > 0 && numMessages > 0) {
                            messages = messages.concat(_messages);
                            return pullMessages(numMessages - _messages.length, messages);
                        }
                        return messages;
                    });
                }

                return pullMessages(1000).then(messages => expect(messages.length).to.equal(1000));
            });
        });

        it('should stream messages successfully', function(done) {
            let topic = pubsub.topic('test');
            topic.subscribe('subTest2').then(data => {
                let sub = data[0];
                let count = 0;
                let doneFlag = false;
                sub.on('error', err => done(err));
                sub.on('message', (message) => {
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