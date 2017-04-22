"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Datastore = require("@google-cloud/datastore");
const fs_1 = require("fs");
let config = null;
let ds = null;
let configPath = './.config/config.json';
// get config
fs_1.accessSync(configPath);
config = JSON.parse(fs_1.readFileSync(configPath, 'utf8'));
ds = new Datastore({
    projectId: config['project_id']
});
let options = {
    path: ['test', '1234']
};
let data = { name: 'Kory', value: 1, moreData: "test data" };
let key = ds.key(options);
let entity = {
    data: data,
    key: key
};
ds.get(key)
    .then(data => console.log(`Data: ${data}`))
    .catch(reason => console.log(reason));
//# sourceMappingURL=playground.js.map