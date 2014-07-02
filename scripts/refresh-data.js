#!/usr/local/bin/node

/**

1. Fetch users (tokens) that haven't been updated in more than X time
2. For each user, fetch event feeds: attending, created, maybe, not_replied,
   declined.
3. For each user, keep a list of (event_id: 1, event_type: not_replied) pairs.
4. Add each event to the Events table, with minimal info

1. Fetch events that that haven't been updated for more than X time
2. For each event, get event data and save in DB
3. Add each venue to the Venues table

1. For each venue that hasn't been updated in more than X time,
   fetch data and update DB

---

To keep a user refreshed, you need to fetch his lists of events
To keep an event refreshed, you need to fetch its info
To keep a venue refreshed, you need to fetch its info

*/

var DB = require('../lib/db-service');
var r = require('rethinkdb');

var conn;
r.connect({ hostname: 'localhost', port: 28015 }).then(function(connection) {
    conn = connection;
}).then(function() {
    // add filter for newly updated users
    return r.db('EventsMK').table('Users')
        .run(conn).then(function(cursor) {
            return cursor.toArray();
        });
}).then(function(users) {
    return users.map(function(user) {
        return DB.user.refreshEventList(conn, user.id).then(function() {
            return DB.user.expandEventInfo(conn, user.id);
        });
    });
}).all().then(function() {
    process.exit(0);
}).error(console.log.bind(console));
