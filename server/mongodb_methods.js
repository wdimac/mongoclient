/**
 * Created by RSercan on 27.12.2015.
 */
Meteor.methods({
    'connect': function (connection) {
        var connectionUrl = getConnectionUrl(connection);
        console.log('connecting to : ' + connectionUrl);
        var mongodbApi = Meteor.npmRequire('mongodb').MongoClient;

        return Async.runSync(function (done) {
            mongodbApi.connect(connectionUrl, function (err, db) {
                if (db == null || db == undefined) {
                    console.log('could not connect, db is null');
                    done(err, db);
                } else {
                    db.listCollections().toArray(function (err, collections) {
                        db.close();
                        done(err, collections);
                    });
                }
            });
        });
    },

    'geoHaystackSearch': function (connection, selectedCollection, xAxis, yAxis, options) {
        var methodArray = [
            {
                "geoHaystackSearch": [xAxis, yAxis, options]
            }
        ];
        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'dropIndex': function (connection, selectedCollection, indexName) {
        var methodArray = [
            {
                "dropIndex": [indexName]
            }
        ];

        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'distinct': function (connection, selectedCollection, selector, fieldName) {
        var methodArray = [
            {
                "distinct": [fieldName, selector]
            }
        ];

        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'delete': function (connection, selectedCollection, selector) {
        var methodArray = [
            {
                "deleteMany": [selector]
            }
        ];

        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'createIndex': function (connection, selectedCollection, fields, options) {
        var methodArray = [
            {
                "createIndex": [fields, options]
            }
        ];

        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'findOne': function (connection, selectedCollection, selector, cursorOptions) {
        var methodArray = [
            {
                "find": [selector]
            }
        ];
        for (var key in cursorOptions) {
            if (cursorOptions.hasOwnProperty(key) && cursorOptions[key]) {
                var obj = {};
                obj[key] = [cursorOptions[key]];
                methodArray.push(obj);
            }
        }
        methodArray.push({'limit': [1]});
        methodArray.push({'next': []});
        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'find': function (connection, selectedCollection, selector, cursorOptions) {
        var methodArray = [
            {
                "find": [selector]
            }
        ];
        for (var key in cursorOptions) {
            if (cursorOptions.hasOwnProperty(key) && cursorOptions[key]) {
                var obj = {};
                obj[key] = [cursorOptions[key]];
                methodArray.push(obj);
            }
        }
        methodArray.push({'toArray': []});
        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'findOneAndUpdate': function (connection, selectedCollection, selector, setObject, options) {
        var methodArray = [
            {
                "findOneAndUpdate": [selector, setObject, options]
            }
        ];
        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'findOneAndReplace': function (connection, selectedCollection, selector, setObject, options) {
        var methodArray = [
            {
                "findOneAndReplace": [selector, setObject, options]
            }
        ];
        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'findOneAndDelete': function (connection, selectedCollection, selector, options) {
        var methodArray = [
            {
                "findOneAndDelete": [selector, options]
            }
        ];
        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'aggregate': function (connection, selectedCollection, pipeline) {
        var methodArray = [
            {
                "aggregate": [pipeline]
            }
        ];
        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'count': function (connection, selectedCollection, selector) {
        var methodArray = [
            {
                "count": [selector]
            }
        ];
        return proceedQueryExecution(connection, selectedCollection, methodArray);
    },

    'dropDB': function (connection) {
        var connectionUrl = getConnectionUrl(connection);
        var mongodbApi = Meteor.npmRequire('mongodb').MongoClient;

        return Async.runSync(function (done) {
            mongodbApi.connect(connectionUrl, function (err, db) {
                db.dropDatabase(function (err, result) {
                    db.close();
                    done(err, result);
                });
            });
        });
    }
});

var proceedQueryExecution = function (connection, selectedCollection, methodArray) {
    var connectionUrl = getConnectionUrl(connection);
    var mongodbApi = Meteor.npmRequire('mongodb').MongoClient;

    console.log('Connection: ' + connectionUrl + '/' + selectedCollection + ', MethodArray: ' + JSON.stringify(methodArray));

    var result = Async.runSync(function (done) {
        mongodbApi.connect(connectionUrl, function (err, db) {
            try {
                var execution = db.collection(selectedCollection);
                for (var i = 0; i < methodArray.length; i++) {
                    var last = i == (methodArray.length - 1);
                    var entry = methodArray[i];
                    for (var key in entry) {

                        if (last && key == Object.keys(entry)[Object.keys(entry).length - 1]) {
                            entry[key].push(function (err, docs) {
                                done(err, docs);
                                db.close();
                            });
                            execution[key].apply(execution, entry[key]);
                        }
                        else {
                            execution = execution[key].apply(execution, entry[key]);
                        }
                    }
                }
            }
            catch (ex) {
                console.error(ex);
                done(ex, null);
                db.close();
            }
        });
    });

    convertBSONtoJSON(result);
    return result;
};