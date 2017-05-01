"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Logging = require("@google-cloud/logging");
var chalk = require("chalk");
var chai_1 = require("chai");
var fs_1 = require("fs");
var config;
var logService;
before(function () {
    var configPath = '.config/config.json';
    // get config
    console.log(chalk.green('reading configuration...'));
    config = JSON.parse(fs_1.readFileSync(configPath, 'utf8'));
    logService = new Logging({
        projectId: config['project_id']
    });
});
describe('Logging', function () {
    it('should write string log', function () {
        var log = logService.log('types-test');
        var entry = log.entry('Abracadabra');
        log.write(entry, {
            labels: { name: 'test-log' }
        });
        return log.getEntries()
            .then(function (data) {
            var entries = data[0];
            chai_1.expect(entries).to.have.length.above(0);
            chai_1.expect(entries[0].data).to.equal('Abracadabra');
        });
    });
    it('should write object log', function () {
        var log = logService.log('types-test-object');
        var obj = { module: 'test', message: 'this is only a test', error: 'Test' };
        var entry = log.entry(obj);
        log.write(entry, {
            labels: { name: 'test-log' }
        });
        return log.getEntries()
            .then(function (data) {
            var entries = data[0];
            chai_1.expect(entries).to.have.length.above(0);
            chai_1.expect(entries[0].data).to.deep.equal(obj);
        });
    });
    it('should write debug log', function () {
        var log = logService.log('types-test-debug');
        var entry = log.entry('Abracadabra');
        log.debug(entry, {
            labels: { name: 'test-log' }
        });
        return log.getEntries()
            .then(function (data) {
            var entries = data[0];
            chai_1.expect(entries).to.have.length.above(0);
            chai_1.expect(entries[0].data).to.equal('Abracadabra');
        });
    });
});
//# sourceMappingURL=logging.js.map