"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Datastore = require("@google-cloud/datastore");
var fs_1 = require("fs");
var config = null;
var ds = null;
var configPath = './.config/config.json';
// get config
fs_1.accessSync(configPath);
config = JSON.parse(fs_1.readFileSync(configPath, 'utf8'));
ds = new Datastore({
    projectId: config['project_id'],
    apiEndpoint: 'localhost:8304'
});
var options = {
    path: ['test', '1234']
};
var data = { name: 'Kory', value: 1, moreData: "test data" };
var key = ds.key(options);
var entity = {
    data: data,
    key: key
};
var entities = [];
var testData = JSON.parse(fs_1.readFileSync('test_data/mock-data.json', 'utf8'));
var opts = {
    path: ['types/test']
};
key = ds.key(opts);
for (var _i = 0, _a = testData.slice(0, 250); _i < _a.length; _i++) {
    var entry = _a[_i];
    entities.push({
        key: key,
        data: entry
    });
}
ds.save(entities)
    .then(function () {
    ds.createQuery('types/test')
        .select('__key__')
        .run().then(function (data) { return console.log(data); });
});
//# sourceMappingURL=playground.js.map