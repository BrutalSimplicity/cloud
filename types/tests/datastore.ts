import * as Datastore from '@google-cloud/datastore';
import * as dateformat from 'dateformat';
import * as chalk from 'chalk';
import { accessSync, readFileSync } from 'fs';
import { expect } from 'chai';
import { sleepSync } from './utils';

interface MockData {
    id: number,
    first_name: string,
    last_name: string,
    email: string,
    gender: string,
    ip_address: string
}

let config = null;
let ds: Datastore = null;
before(function () {
    let configPath = '.config/config.json';
    // get config
    console.log(chalk.green('reading configuration...'));
    config = JSON.parse(readFileSync(configPath, 'utf8'));

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
            expect(ds.projectId).to.equal(config['project_id']);
        });
        it('should assign a namespace', function () {
            let dsConfig: Datastore.DatastoreConfiguration = {
                projectId: config['project_id'],
                namespace: 'test'
            };

            let ds: Datastore = new Datastore(dsConfig);
            expect(ds.namespace).to.equal('test');
        });
    });

    describe('#key', function () {
        let key = null;
        beforeEach(function () {
            let options: Datastore.KeyOptions = {
                path: ['test', 1234]
            }

            // kind and id are implementation details that are
            // not included in the tsd. But, based on the js
            // module, the key should have a kind and id property
            // filled in.
            key = ds.key(options) as any;
        })
        it('should return Key', function () {
            expect(key.kind).to.not.be.empty;
            expect(key.kind).to.equal('test');
            expect(key.id).to.equal(1234);
        });

        it('should return partial key', function () {
            expect(key.kind).to.equal('test');
        });
    });

    describe('#int', function () {
        it('should return Int', function () {
            let i = ds.int(1234);
            expect(i.value).to.equal('1234');

            i = ds.int('1234');
            expect(i.value).to.equal('1234');
        })
    });

    describe('#double', function () {
        it('should return Double', function () {
            let i = ds.double(1234.1234);
            expect(i.value).to.equal(1234.1234);
        })
    });

    describe('#geoPoint', function () {
        it('should return GeoPoint', function () {
            let coor = ds.geoPoint({
                latitude: 40.6894,
                longitude: -74.0447
            });
            expect(coor.value).to.deep.equal({ latitude: 40.6894, longitude: -74.0447 });
        });
    });

    describe('crud single entity', function () {
        let key = null;
        let mockData: MockData = {
            email: 'pwarren0@sun.com',
            id: 1,
            first_name: 'Phillip',
            last_name: 'Warren',
            gender: 'Male',
            ip_address: '132.3.989.209'
        }
        beforeEach(function () {
            let opts: Datastore.KeyOptions = {
                path: ['types/test', '000001']
            };
            key = ds.key(opts);
        });
        afterEach(function () {
            ds.delete(key);
        });

        it('should save successfully', function () {
            // increase the max 2-second wait period of mocha
            let entity: Datastore.ObjectEntity<MockData> = {
                data: mockData,
                key: key
            };

            // as long as the save is not rejected, we'll assume
            // it succeeds. Get will test end-to-end.
            return ds.save(entity);
        });

        it('should save successfully with field definitions', function () {
            let entity: Datastore.FieldDefinitionEntity = {
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
            let entity: Datastore.ObjectEntity<MockData> = {
                key: key,
                data: mockData
            };

            return ds.save(entity)
                .then(_ => {
                    return ds.get(key)
                        .then(data => expect(data[0]).to.deep.equal(mockData));
                })
        });

        it('should delete an entity', function () {
            let entity: Datastore.ObjectEntity<MockData> = {
                data: mockData,
                key: key
            };
            return ds.save<MockData>(entity)
                .then(() => {
                    return ds.delete(key)
                        .then(() => {
                            return ds.get<MockData>(key).then(data => expect(data[0]).to.be.undefined);
                        });
                });
        });
    });

    describe('crud multiple entities', function () {
        /* in this test we will work with a batch of entities created at the start
         * and only deleted after the last test.
         */

        let partialKey = null;
        let testData: MockData[] = null;
        before(function () {
            // increase the max 2-second wait period of mocha
            let entities: Datastore.ObjectEntity<MockData>[] = [];
            testData = JSON.parse(readFileSync('test_data/mock-data.json', 'utf8'));
            let opts: Datastore.KeyOptions = {
                path: ['types/test']
            };
            partialKey = ds.key(opts);
            for (var entry of testData) {
                entities.push({
                    key: partialKey,
                    data: entry
                });
            }
            while (entities.length > 0) {

                // can only save a max of 500 entities at a time
                let entitiesToSave = entities.splice(0, 500);

                // when saving an entity with a partial key
                // the datastore auto-generates the id to make
                // a whole key
                ds.save(entitiesToSave);
            }
        });

        after(function () {
            let keys = [];
            return ds.createQuery('types/test')
                .select('__key__')
                .run<any>()
                .then(data => {
                    keys = data[0].map(d => d[Datastore.KEY]);
                    while (keys.length > 0) {
                        let deleteKeys = keys.splice(0, 500);
                        ds.delete(deleteKeys);
                    }
                });
        });

        it('should get multiple entities', function () {
            let keysToGet = [];
            for (let i = 1; i <= 26; i++)
                keysToGet.push(ds.key({
                    path: ['types/test', i]
                }));
            return ds.get<MockData>(keysToGet)
                .then(data => expect(data[0].length).to.equal(25));
        });

        it('it should get last 25 entities', function () {
            return ds.createQuery('types/test')
                .order('id', { descending: true })
                .limit(25)
                .run<MockData>().then(data => {
                    expect(data[0].length).to.equal(25);
                    expect(data[0][0].id).to.equal(1000);
                });
        });
    });
});

