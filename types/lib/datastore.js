"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Datastore = require("@google-cloud/datastore");
var chalk = require("chalk");
var fs_1 = require("fs");
var chai_1 = require("chai");
var config = null;
var ds = null;
before(function () {
    var configPath = '.config/config.json';
    // get config
    console.log(chalk.green('reading configuration...'));
    config = JSON.parse(fs_1.readFileSync(configPath, 'utf8'));
    // create a new datastore instance and display the current
    // base url
    ds = new Datastore({
        projectId: config['project_id'],
        apiEndpoint: config['datastore_host']
    });
    console.log(chalk.yellow('Datastore base url: ' + ds.baseUrl_));
});
beforeEach(function () {
    ds = new Datastore({
        projectId: config['project_id'],
        apiEndpoint: config['datastore_host']
    });
});
describe('Datastore', function () {
    describe('#constructor', function () {
        it('should assign a project id', function () {
            chai_1.expect(ds.projectId).to.equal(config['project_id']);
        });
        it('should assign a namespace', function () {
            var dsConfig = {
                projectId: config['project_id'],
                namespace: 'test'
            };
            var ds = new Datastore(dsConfig);
            chai_1.expect(ds.namespace).to.equal('test');
        });
    });
    describe('#key', function () {
        var key = null;
        beforeEach(function () {
            var options = {
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
            var i = ds.int(1234);
            chai_1.expect(i.value).to.equal('1234');
            i = ds.int('1234');
            chai_1.expect(i.value).to.equal('1234');
        });
    });
    describe('#double', function () {
        it('should return Double', function () {
            var i = ds.double(1234.1234);
            chai_1.expect(i.value).to.equal(1234.1234);
        });
    });
    describe('#geoPoint', function () {
        it('should return GeoPoint', function () {
            var coor = ds.geoPoint({
                latitude: 40.6894,
                longitude: -74.0447
            });
            chai_1.expect(coor.value).to.deep.equal({ latitude: 40.6894, longitude: -74.0447 });
        });
    });
    describe('crud single entity', function () {
        var key = null;
        var mockData = {
            email: 'pwarren0@sun.com',
            id: 1,
            first_name: 'Phillip',
            last_name: 'Warren',
            gender: 'Male',
            ip_address: '132.3.989.209'
        };
        beforeEach(function () {
            var opts = {
                path: ['types/test', '000001']
            };
            key = ds.key(opts);
        });
        afterEach(function () {
            ds.delete(key);
        });
        it('should save successfully', function () {
            // increase the max 2-second wait period of mocha
            var entity = {
                data: mockData,
                key: key
            };
            // as long as the save is not rejected, we'll assume
            // it succeeds. Get will test end-to-end.
            return ds.save(entity);
        });
        it('should save successfully with field definitions', function () {
            var entity = {
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
            var entity = {
                key: key,
                data: mockData
            };
            return ds.save(entity)
                .then(function (_) {
                return ds.get(key)
                    .then(function (data) { return chai_1.expect(data[0]).to.deep.equal(mockData); });
            });
        });
        it('should delete an entity', function () {
            var entity = {
                data: mockData,
                key: key
            };
            return ds.save(entity)
                .then(function () {
                return ds.delete(key)
                    .then(function () {
                    return ds.get(key).then(function (data) { return chai_1.expect(data[0]).to.be.undefined; });
                });
            });
        });
    });
    describe('crud multiple entities', function () {
        /* in this test we will work with a batch of entities created at the start
         * and only deleted after the last test.
         */
        var partialKey = null;
        var testData = null;
        before(function () {
            // increase the max 2-second wait period of mocha
            var entities = [];
            testData = JSON.parse(fs_1.readFileSync('test_data/mock-data.json', 'utf8'));
            var i = 1;
            for (var _i = 0, testData_1 = testData; _i < testData_1.length; _i++) {
                var entry = testData_1[_i];
                var opts = {
                    path: ['types/test', i++]
                };
                var key = ds.key(opts);
                entities.push({
                    key: key,
                    data: entry
                });
            }
            while (entities.length > 0) {
                // can only save a max of 500 entities at a time
                var entitiesToSave = entities.splice(0, 500);
                // when saving an entity with a partial key
                // the datastore auto-generates the id to make
                // a whole key
                ds.save(entitiesToSave);
            }
        });
        after(function () {
            var keys = [];
            return ds.createQuery('types/test')
                .select('__key__')
                .run()
                .then(function (data) {
                keys = data[0].map(function (d) { return d[Datastore.KEY]; });
                while (keys.length > 0) {
                    var deleteKeys = keys.splice(0, 500);
                    ds.delete(deleteKeys);
                }
            });
        });
        it('should get multiple entities', function () {
            var keysToGet = [];
            for (var i = 1; i <= 25; i++)
                keysToGet.push(ds.key({
                    path: ['types/test', i]
                }));
            return ds.get(keysToGet)
                .then(function (data) { return chai_1.expect(data[0].length).to.equal(25); });
        });
        it('it should get last 25 entities', function () {
            return ds.createQuery('types/test')
                .order('id', { descending: true })
                .limit(25)
                .run().then(function (data) {
                chai_1.expect(data[0].length).to.equal(25);
                chai_1.expect(data[0][0].id).to.equal(1000);
            });
        });
    });
});
//# sourceMappingURL=datastore.js.map