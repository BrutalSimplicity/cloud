import * as PubSub from '@google-cloud/pubsub';
import * as chalk from 'chalk';
import { expect } from 'chai';
import { readFileSync } from 'fs';

let config: any;
let pubsub: PubSub;
before(function () {
    let configPath = '.config/config.json';
    // get config
    console.log(chalk.green('reading configuration...'));
    config = JSON.parse(readFileSync(configPath, 'utf8'));

    pubsub = new PubSub({
        projectId: config['project_id']
        
    });
});