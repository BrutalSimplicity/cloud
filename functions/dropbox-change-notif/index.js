var request = require('request');
const crypto = require('crypto');
const fs = require('fs');
var _ = require('lodash');
const Logging = require('@google-cloud/logging');
const Datastore = require('@google-cloud/datastore');

// gcloud project
const projectId = 'api-project-647667324842';
const log = Logging({projectId: projectId}).log('functions');
const datastore = new Datastore({projectId: projectId});

// dropbox settings and rest defaults
const dropboxKey = 'HlclUf6MAzAAAAAAAAACZkqDFnR0rj-qKUgzb020124NJOYQ5S8S7NLtsmas2z-F';
const hmac = crypto.createHmac('sha256', dropboxKey);
request = request.defaults({
	baseUrl: 'https://api.dropboxapi.com/2',
	auth: {
		bearer: 'HlclUf6MAzAAAAAAAAACZkqDFnR0rj-qKUgzb020124NJOYQ5S8S7NLtsmas2z-F'
	},
});

// special download folder
const scheduleDownloadFolder = '_torysync';

function dropbox_change_notif(req, res) {
	// respond to dropbox webhook verification challenge
	if (req.method === 'GET' && req.get('challenge')) {
		res.status(200).send(req.get('challenge'));
	}
	else if (req.method === 'POST') {
		dbxSignature = req.get('X-Dropbox-Signature');
		reqSignature = hmac.update(JSON.stringify(req.body));

		// Verify this is an authorized dropbox notification
		if (dbxSignature === reqSignature) {
			onFolderChange(scheduleNewDownload);
		}
		else {
			res.status(403).end();
		}
	}
}

function scheduleNewDownload(entries) {
	if (entries && entries.length > 0) {
		torrentEntries = _.filter(entries, function(entry) { return _.endsWith(entry.name, '.torrent'); });
		magnetEntries = _.filter(entries, function(entry) { return _.endsWith(entry.name, '.magnet'); });
		if (torrentEntries.length > 0) {
			_.forEach(torrentEntries, function(entry) {
				downloadDropboxFile(entry.id, publishNewTorrentDownload);
			});
		}
		if (magnetEntries.length > 0) {
			_.forEach(magnetEntries, function(entry) {
				downloadDropboxFile(entry.id, publishNewMagnetDownload);
			})
		}
	}
}

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

function onFolderChange(path, callback) {
	getFolderCursor(path, function(cursorEntity) {
		if (cursorEntity) {
			getNewDropboxFilesAndFolders(cursorEntity.cursor, function(dbxEntriesMeta) {
				if (dbxEntriesMeta.entries && dbxEntriesMeta.entries.length > 0) {
					onNewDownloadEntries(dbxEntriesMeta.entries, callback);
					var newCursorEntity = {
						path: path,
						cursor: dbxEntriesMeta.cursor
					}
					saveFolderCursorEntity(newCursorEntity);
				}
			});
		} 
		else {
			getDropboxFilesAndFolders(path, function(dbxEntriesMeta) {
				if (dbxEntriesMeta.entries && dbxEntriesMeta.entries.length > 0)
					onNewDownloadEntries(dbxEntriesMeta.entries, callback);
			});
		}
	});
}

function onNewDownloadEntries(entries, callback) {
	if (entries.length == 0)
		return;

	var ids = [];
	_.foreach(entries, function(e) { ids.push(e.dropboxId); });
	getDownloadEntryByMultipleDropboxIds(ids, function(savedEntries) {
		if (savedEntries != null) {
			uniqueEntries = [];
			_.forEach(entries, function(entry) {
				var sameEntries = _.filter(savedEntries, function(dbEntry) { return entry.dropboxId == dbEntry; });
				if (sameEntries.length > 0) {
					return;
				}
				else {
					uniqueEntries.append(entry);
				}
			});

			if (uniqueEntries.length > 0) {
				callback(uniqueEntries);
			}
		}
	});
}

function publishNewTorrentDownload(meta, content, category) {
    // attempt to convert the path of the file to a
    // category. Categories are just the parent directory,
    // unless the parent is root ('_torysync')
    var path_split = _.split(_.trim(meta.path_lower, '/'), '/');
    var category = 'other';
    if (path_split[path_split.length - 2] !== scheduleDownloadFolder) {
        category = path_split[path_split.length - 2];
    }

	var message = createPublishMessage(meta, 'magnet', linesplit[1], category);
	publishMessage('events', message, saveDownloadEntry(message));
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

    var magIdx = 0;
    _.forEach(splitlines, function(line) {
        var linesplit = _.split(line, ' ');
        var category = 'other';
        var content = linesplit[0];
        if (linesplit.length > 1) {
            category = linesplit[0];
            content = linesplit[1];
        }

        var message = createPublishMessage(meta, 'magnet', linesplit[1], category);
		publishMessage('events', message, saveDownloadEntry(message));
		magIdx++;
    });
}

function createPublishMessage(meta, source, content, category) {
    return {
        dropboxId: meta.id,
        source: source,
        category: category,
        path: meta.path_lower,
        data: (new Buffer(content)).toString('base64'),
        createdAt: new Date(),
        startedAt: false,
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
function getDropboxFilesAndFolders(path, callback) {
	request.post('/files/list_folder/continue', {
		json: { 
			path: '/' + path,
			recursive: 'true'
		}
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			callback(body);
		}
		else {
			logError({
				message: 'An error occurred accessing the Dropbox API.',
				error: error
			});
		}
	});
}

function getNewDropboxFilesAndFolders(cursor, callback) {
	request.post('/files/list_folder', {
		json: { 
			cursor: cursor
		}
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			callback(body);
		}
		else {
			logError({
				message: 'An error occurred accessing the Dropbox API.',
				error: error
			});
		}
	});
}

function getFolderCursor(path, callback) {
	cursorKey = datastore.key(['Cursor', path]);
	result = null;
	datastore.get(cursorKey, function(err, entity) {
		callback(entity);
	});

	return result;
}

function saveFolderCursor(path, cursor) {
	saveFolderCursorEntity({
		path: path,
		cursor: cursor
	});
}

function saveFolderCursorEntity(entity) {
	kind = 'Cursor';
	cursorKey = datastore.key([kind, entity.path]);
	dataBlob =  {
		key: cursorKey,
		data: entity
	};
	datastore.save(dataBlob, function(err) {
		logError({
			'message': 'An error occurred saving the cursor',
			'error': err
		});
	});
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

function saveDownloadEntry(downloadEntry, index) {
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

module.exports = dropbox_change_notif;