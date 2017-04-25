"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var dateformat = require("dateformat");
var chalk = require("chalk");
var fd = fs_1.openSync('./.logs/' + dateformat(new Date(), 'yyyymmdd_HH.MM.ss') + '_datastore.log', 'w');
var config = JSON.parse(fs_1.readFileSync('.config/config.json', 'utf8'));
console.log(chalk.yellow('datastore host: ' + config['datastore_host']));
var options = {
    cwd: '.',
    shell: true,
    stdio: ['ignore', fd, fd]
};
var child = child_process_1.spawn('gcloud beta emulators datastore start', ["--host-port=" + config['datastore_host'], '--data-dir=./.data'], options);
console.log(chalk.green('starting local datastore server...'));
//# sourceMappingURL=startDatastoreServer.js.map