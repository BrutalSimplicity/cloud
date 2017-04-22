import * as Datastore from '@google-cloud/datastore';
import { accessSync, readFileSync } from 'fs';
import { expect } from 'chai';

let config = null;
let ds: Datastore = null;
let configPath = './.config/config.json';
// get config
accessSync(configPath);
config = JSON.parse(readFileSync(configPath, 'utf8'));

ds = new Datastore({
    projectId: config['project_id']
});

let options: Datastore.KeyOptions = {
    path: ['test', '1234']
};

interface Data {
    name: string;
    value: number;
    moreData: string;
}

let data: Data = { name: 'Kory', value: 1, moreData: "test data" };

let key = ds.key(options);

let entity: Datastore.ObjectEntity<Data> = {
    data: data,
    key: key
};

ds.get(key)
    .then(data => console.log(`Data: ${data}`))
    .catch(reason => console.log(reason));