var fs = require('fs');
var cp = require('child_process');

if (!fs.existsSync('./.logs')) {
    fs.mkdirSync('./.logs');
}
var fd = fs.openSync('./.logs/' + Date.now() + '_datastore.log', 'w');
var config = JSON.parse(fs.readFileSync('.config/config.json', 'utf8'));

var child = cp.execSync(`gcloud beta emulators datastore start --host-port=${config['datastore_host']} --data-dir=./.data`, {
    stdio: ['ignore', fd, fd]
});
