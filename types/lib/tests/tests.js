"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Datastore = require("@google-cloud/datastore");
const fs_1 = require("fs");
const chai_1 = require("chai");
let config = null;
let ds = null;
before(() => {
    let configPath = '.config/config.json';
    // get config
    fs_1.accessSync(configPath);
    config = JSON.parse(fs_1.readFileSync(configPath, 'utf8'));
});
beforeEach(function () {
    ds = new Datastore({
        projectId: config['project_id']
    });
});
describe('Datastore', function () {
    describe('#constructor', function () {
        it('should assign a project id', function () {
            chai_1.expect(ds.projectId).to.equal(config['project_id']);
        });
        it('should assign a namespace', function () {
            let dsConfig = {
                projectId: config['project_id'],
                namespace: 'test'
            };
            let ds = new Datastore(dsConfig);
            chai_1.expect(ds.namespace).to.equal('test');
        });
    });
    describe('#key', function () {
        let key = null;
        beforeEach(function () {
            let options = {
                path: ['test', 1234]
            };
            // kind and id are implementation details that are
            // not included in the tsd. But, based on the js
            // module, the key should have a kind and id property
            // filled in.
            key = ds.key(options);
        });
        it('should return Key', function () {
            chai_1.expect(key.kind).to.not.be.empty;
            chai_1.expect(key.kind).to.equal('test');
            chai_1.expect(key.id).to.equal(1234);
        });
        it('should return partial key', function () {
            chai_1.expect(key.kind).to.equal('test');
        });
    });
    describe('#int', function () {
        it('should return Int', function () {
            let i = ds.int(1234);
            chai_1.expect(i.value).to.equal('1234');
            i = ds.int('1234');
            chai_1.expect(i.value).to.equal('1234');
        });
    });
    describe('#double', function () {
        it('should return Double', function () {
            let i = ds.double(1234.1234);
            chai_1.expect(i.value).to.equal(1234.1234);
        });
    });
    describe('#geoPoint', function () {
        it('should return GeoPoint', function () {
            let coor = ds.geoPoint({
                latitude: 40.6894,
                longitude: -74.0447
            });
            chai_1.expect(coor.value).to.deep.equal({ latitude: 40.6894, longitude: -74.0447 });
        });
    });
    describe('crud single entity', function () {
        let key = null;
        let mockData = {
            email: 'pwarren0@sun.com',
            id: 1,
            first_name: 'Phillip',
            last_name: 'Warren',
            gender: 'Male',
            ip_address: '132.3.989.209'
        };
        beforeEach(function () {
            let opts = {
                path: ['types/test', '000001']
            };
            key = ds.key(opts);
        });
        afterEach(function () {
            ds.delete(key);
        });
        it('should save successfully', function () {
            let entity = {
                data: mockData,
                key: key
            };
            // as long as the save is not rejected, we'll assume
            // it succeeds. Get will test end-to-end.
            return ds.save(entity);
        });
        it('should save successfully with field definitions', function () {
            let entity = {
                key: key,
                data: [
                    {
                        name: 'id',
                        value: mockData.id
                    },
                    {
                        name: 'first_name',
                        value: mockData.first_name
                    },
                    {
                        name: 'last_name',
                        value: mockData.last_name
                    },
                    {
                        name: 'email',
                        value: mockData.email
                    },
                    {
                        name: 'gender',
                        value: mockData.gender
                    },
                    {
                        name: 'ip_address',
                        value: mockData.ip_address,
                        excludeFromIndexes: true
                    }
                ]
            };
            return ds.save(entity);
        });
        it('should get mock data', function () {
            let entity = {
                key: key,
                data: mockData
            };
            ds.save(entity);
            ds.get(key)
                .then(data => chai_1.expect(data).to.deep.equal(entity));
        });
    });
    describe('crud multiple entities', function () {
        let key = null;
        let testData = null;
        beforeEach(function () {
            fs_1.accessSync('test_data/mock-data.json');
            testData = JSON.parse(fs_1.readFileSync('test_data/mock-data.json', 'utf8'));
            let opts = {
                path: ['types/test']
            };
            key = ds.key(opts);
        });
        afterEach(function () {
            ds.delete(key);
        });
        it('should save batched entities', function () {
            let entity = {};
        });
    });
});
//# sourceMappingURL=tests.js.map