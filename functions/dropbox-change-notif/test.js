var request = require('request');
const crypto = require('crypto');
const fs = require('fs');
var _ = require('lodash');
const Logging = require('@google-cloud/logging');
const Datastore = require('@google-cloud/datastore');
const PubSub = require('@google-cloud/pubsub');

// gcloud project
const projectId = 'api-project-647667324842';
const eventTopic = 'events';
const dataStoreKind = 'DownloadEntry';
const log = new Logging({projectId: projectId}).log('functions');
const datastore = new Datastore({projectId: projectId});
const pubsub = new PubSub({ projectId: projectId });

// dropbox settings and rest defaults
const dropboxKey = 'HlclUf6MAzAAAAAAAAACZkqDFnR0rj-qKUgzb020124NJOYQ5S8S7NLtsmas2z-F';
const hmac = crypto.createHmac('sha256', dropboxKey);
request = request.defaults({
	baseUrl: 'https://api.dropboxapi.com/2',
	auth: {
		bearer: 'HlclUf6MAzAAAAAAAAACZkqDFnR0rj-qKUgzb020124NJOYQ5S8S7NLtsmas2z-F'
	},
});

const kind = 'Test';
const name = 'testSample1';
const testKey = datastore.key([kind, name]);
const test = {
    key: testKey,
    data: {
        name: name,
        description: 'A test trying out Google\'s datastore.'
    }
};
// datastore.get(testKey, function(err, entity) {
//     if (!err) {
            // console.log(entity);
//     }
// });
// https://www.dropbox.com/developers/documentation/http/documentation
function downloadDropboxFile(id, callback) {
	request.post('/files/download', {
        baseUrl: 'https://content.dropboxapi.com/2',
        headers: {
            'Dropbox-API-Arg': JSON.stringify({
                path: id
            })
        },
	}, function(error, response, data) {
        if (!error && response.statusCode === 200) {
            var contentMeta = JSON.parse(response.headers['dropbox-api-result']);
            callback(contentMeta, data);
        }
    });
}

function publishNewTorrentDownload(meta, content, category) {
    // attempt to convert the path of the file to a
    // category. Categories are just the parent directory,
    // unless the parent is root ('_torysync')
    var path_split = _.split(_.trim(meta.path_lower, '/'), '/');
    var category = 'other';
    if (path_split[path_split.length - 2] !== '_torysync') {
        category = path_split[path_split.length - 2];
    }

    saveNewDownloadEntry(createPublishMessage(meta, 'torrent', content, category));
}

function publishNewMagnetDownload(meta, content) {
    // since magnets are links, the convention is to
    // store them in a file with a .magnet extension
    // and this reads each line of the file
    // looking for a category and magnet link. If no
    // category then default to Other
    var splitlines = content;
    if (_.includes(splitlines, '\r\n'))
        splitlines = _.split(content, '\r\n');
    else
        splitlines = _.split(content, '\n');
    
    var magIndex = 0;
    _.forEach(splitlines, function(line) {
        var linesplit = _.split(line, ' ');
        var category = 'other';
        var content = linesplit[0];
        if (linesplit.length > 1) {
            category = linesplit[0];
            content = linesplit[1];
        }

        saveNewDownloadEntry(createPublishMessage(meta, 'magnet', linesplit[1], category), magIndex);
        magIndex += 1;
    });
}

function createPublishMessage(meta, source, content, category, index) {
    return {
        dropboxId: meta.id,
        source: source,
        category: category,
        path: meta.path_lower,
        data: (new Buffer(content)).toString('base64'),
        createdAt: new Date(),
        startedAt: null,
        completed: false
    };
}

function logError(data) {
    var entry = log.entry(data);

    log.error(entry, { labels: { name: 'dropbox-change-notif' } }, function (err, apiResponse) {});
}

function logInfo(data) {
    var entry = log.entry(data);

    log.info(entry, { labels: { name: 'dropbox-change-notif' } }, function (err, apiResponse) {});
}

function publishMessage(topic, message, callback) {
    topic = pubsub.topic(eventTopic);

    var publishToTopic = function(topic, message) {
        topic.publish(message, function(err, messageIds, apiResponse) {
            if (err) {
                logError({
                    'message': 'Error publishing message.',
                    'error': err
                });
                return;
            }

            logInfo({
                'message': 'Message published successfully.',
                'data': {
                    'id': message.dropboxId,
                    'path': message.path,
                }
            });
        });
    }

    topic.exists(function(err, exists) {
        if (err) {
            logError({
                message: 'Error retrieving topic',
                error: err
            });
            return;
        }
        
        if (exists) {
            publishToTopic(topic, message);
            if (callback)
                callback(message);
        }
        else {
            topic.create(function(err, topic, apiResponse) {
                if (err) {
                    logError({
                        message: 'Error creating topic.',
                        error: err
                    });
                    return;
                }
                publishToTopic(topic, message);
                if (callback)
                    callback(message);
            })
        }
    });
}

function saveNewDownloadEntry(downloadEntry, index) {
    if (arguments.length > 1)
        var key = datastore.key([dataStoreKind]);
    else
        var key = datastore.key([dataStoreKind]);

    datastore.save(
        {
            key: key,
            data: [
                {
                    name: 'dropboxId',
                    value: downloadEntry.dropboxId,
                },
                {
                    name: 'path',
                    value: downloadEntry.path,
                },
                {
                    name: 'category',
                    value: downloadEntry.category,
                },
                {
                    name: 'source',
                    value: downloadEntry.source,
                },
                {
                    name: 'data',
                    value: downloadEntry.data,
                    excludeFromIndexes: true
                },
                {
                    name: 'createdAt',
                    value: downloadEntry.createdAt,
                },
                {
                    name: 'startedAt',
                    value: downloadEntry.startedAt,
                },
                {
                    name: 'completed',
                    value: downloadEntry.completed
                }
            ]
        }, function (err, response) {
            if (err) {
                logError({
                    'message': 'Error occurred saving the download entry.',
                    'error': err
                });
            }
        });
}

function getDownloadEntryByDropboxId(id, callback) {
    getDownloadEntryByMultipleDropboxIds([id], function(ids) {
        if (ids !== null) {
            callback(id[0]);
        }
        else {
            callback(null);
        }
    })
}

function getDownloadEntryByMultipleDropboxIds(ids, callback) {
    var key = datastore.key([dataStoreKind]);
    var query = datastore.createQuery(dataStoreKind);

    _.forEach(ids, function(id) {
        query.filter('dropboxId', id);
    })
    datastore.runQuery(query, function(err, entities) {
        if (err) {
            callback(null);
        }
        callback(entities);
    });
}

// downloadDropboxFile('id:QrQQ2GDbyiAAAAAAAADj4w', publishNewTorrentDownload);

getDownloadEntryByDropboxId('id:QrQQ2GDbyiAAAAAAAADj4w', function(entry) {
    publishMessage('events', entry);
});

