import * as Logging from '@google-cloud/logging';
import * as chalk from 'chalk';
import { expect } from 'chai';
import { readFileSync } from 'fs';


let config: any;
let logService: Logging;
before(function () {
    let configPath = '.config/config.json';
    // get config
    console.log(chalk.green('reading configuration...'));
    config = JSON.parse(readFileSync(configPath, 'utf8'));

    logService = new Logging({
        projectId: config['project_id']
    });
});

describe('Logging', function() {
    it('should write string log', function() {
        let log = logService.log('types-test');
        let entry = log.entry('Abracadabra');
        log.write(entry, {
            labels: { name: 'test-log' }
        });

        return log.getEntries()
            .then(data => {
                let entries = data[0];

                expect(entries).to.have.length.above(0);
                expect(entries[0].data).to.equal('Abracadabra');
            });
    });

    it('should write object log', function() {
        let log = logService.log('types-test-object');
        let obj = { module: 'test', message: 'this is only a test', error: 'Test' };
        let entry = log.entry(obj);
        log.write(entry, {
            labels: { name: 'test-log' }
        });

        return log.getEntries()
            .then(data => {
                let entries = data[0];

                expect(entries).to.have.length.above(0);
                expect(entries[0].data).to.deep.equal(obj);
            });
    });

    it('should write debug log', function() {
        let log = logService.log('types-test-debug');
        let entry = log.entry('Abracadabra');
        log.debug(entry, {
            labels: { name: 'test-log' }
        });

        return log.getEntries()
            .then(data => {
                let entries = data[0];

                expect(entries).to.have.length.above(0);
                expect(entries[0].data).to.equal('Abracadabra');
            });
    });
});