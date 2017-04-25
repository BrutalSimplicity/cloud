"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var chalk = require("chalk");
var fs_1 = require("fs");
var config = JSON.parse(fs_1.readFileSync('./.config/config.json', 'utf8'));
var shutdownAction = "http://" + config['datastore_host'] + "/shutdown";
request.post(shutdownAction, function () { console.log(chalk.green('local datastore shutdown successfully')); });
//# sourceMappingURL=shutdownDatastoreServer.js.map