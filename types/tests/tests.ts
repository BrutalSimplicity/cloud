import * as Datastore from '@google-cloud/datastore';
import { accessSync, readFileSync } from 'fs';
import { expect } from 'chai';

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
before(() => {
    let configPath = '.config/config.json';
    // get config
    accessSync(configPath);
    config = JSON.parse(readFileSync(configPath, 'utf8'));
});

beforeEach(function() {
    ds = new Datastore({
        projectId: config['project_id']
    });
})

describe('Datastore', function() {
    describe('#constructor', function() {
        it('should assign a project id', function() {
            expect(ds.projectId).to.equal(config['project_id']);
        });
        it('should assign a namespace', function() {
            let dsConfig: Datastore.DatastoreConfiguration = {
                projectId: config['project_id'],
                namespace: 'test'
            };

            let ds: Datastore = new Datastore(dsConfig);
            expect(ds.namespace).to.equal('test');
        });
    });
    
    describe('#key', function() {
        let key = null;
        beforeEach(function() {
            let options: Datastore.KeyOptions = {
                path: ['test', 1234]
            }

            // kind and id are implementation details that are
            // not included in the tsd. But, based on the js
            // module, the key should have a kind and id property
            // filled in.
            key = ds.key(options) as any;
        })
        it('should return Key', function() {
            expect(key.kind).to.not.be.empty;
            expect(key.kind).to.equal('test');
            expect(key.id).to.equal(1234);
        });

        it('should return partial key', function() {
            expect(key.kind).to.equal('test');
        });
    });

    describe('#int', function() {
        it('should return Int', function() {
            let i = ds.int(1234);
            expect(i.value).to.equal('1234');
            
            i = ds.int('1234');
            expect(i.value).to.equal('1234');
        })
    });

    describe('#double', function() {
        it('should return Double', function() {
            let i = ds.double(1234.1234);
            expect(i.value).to.equal(1234.1234);
        })
    });

    describe('#geoPoint', function() {
        it('should return GeoPoint', function() {
            let coor = ds.geoPoint({
                latitude: 40.6894,
                longitude: -74.0447
            });
            expect(coor.value).to.deep.equal({ latitude: 40.6894, longitude: -74.0447 });
        });
    });

    describe('crud single entity',function() {
        let key = null;
        let mockData: MockData = {
            email: 'pwarren0@sun.com',
            id: 1,
            first_name: 'Phillip',
            last_name: 'Warren',
            gender: 'Male',
            ip_address: '132.3.989.209'
        }
        beforeEach(function() {
            let opts: Datastore.KeyOptions = {
                path: ['types/test', '000001']
            };
            key = ds.key(opts);
        });
        afterEach(function() {
            ds.delete(key);
        });

        it('should save successfully', function() {
            let entity: Datastore.ObjectEntity<MockData> = {
                data: mockData,
                key: key
            };

            // as long as the save is not rejected, we'll assume
            // it succeeds. Get will test end-to-end.
            return ds.save<MockData>(entity);
        });

        it('should save successfully with field definitions', function() {
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

        it('should get mock data', function() {
            let entity: Datastore.ObjectEntity<MockData> = {
                key: key,
                data: mockData
            };

            return ds.save(entity)
                .then(_ => {
                    ds.get(key)
                        .then(data => expect(data[0]).to.deep.equal(mockData));
                })
        });
    });

    describe('crud multiple entities', function() {
        let key = null;
        let testData: MockData[] = null;
        beforeEach(function() {
            accessSync('test_data/mock-data.json');
            testData  = JSON.parse(readFileSync('test_data/mock-data.json', 'utf8'));
            let opts: Datastore.KeyOptions = {
                path: ['types/test']
            };
            key = ds.key(opts);
        });

        afterEach(function() {
            ds.delete(key);
        });

        it('should save batched entities', function() {
            this.timeout(10000);
            let entities: Datastore.ObjectEntity<MockData>[] = [];
            for (var entry of testData.slice(0, 250)) {
                entities.push({
                    key: key,
                    data: entry
                });
            }
            return ds.save(entities);
        });

        it('should get multiple entities', function() {
            this.timeout(10000);
            let entities: Datastore.ObjectEntity<MockData>[] = [];
            for (var entry of testData.slice(0, 250)) {
                entities.push({
                    key: key,
                    data: entry
                });
            }
            return ds.save(entities)
                .then(_ => {
                    ds.get<MockData[]>(key)
                        .then(data => expect(data).to.deep.equal(testData.slice(0,250)));
                })
        });
    });
});

