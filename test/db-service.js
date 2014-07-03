var r = require('rethinkdb');
var db = require('../lib/db-service');

var conn;
r.connect({ hostname: 'localhost', port: 28015 }).then(function(connection) {
    conn = connection;
}).then(function() {
    return db.events.getUniqueTokenEventPairs(conn);
}).then(function(pairs) {
    console.log(pairs);
    return db.events.updateEvents(conn, pairs)
}).then(function(res) {
    console.log(res);
}).error(console.log.bind(console))
