"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Datastore = require("@google-cloud/datastore");
const fs_1 = require("fs");
const chai_1 = require("chai");
let config = null;
before(() => {
    let configPath = '.config/config.json';
    // get config
    fs_1.accessSync(configPath);
    config = JSON.parse(fs_1.readFileSync(configPath, 'utf8'));
});
describe('Datastore', function () {
    describe('#constructor', function () {
        it('should assign a project id', function () {
            let dsConfig = {
                projectId: config['project_id']
            };
            let ds = new Datastore(dsConfig);
            chai_1.expect(ds).to.not.be.null;
            chai_1.expect(ds.projectId).to.equal(config['project_id']);
        });
    });
});
//# sourceMappingURL=tests.js.map