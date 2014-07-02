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

var FB = require('./fb-service');
var r = require('rethinkdb');

var conn;
r.connect({ hostname: 'localhost', port: 28015 }).then(function(connection) {
    conn = connection;
    console.log("Connected to RethinkDB");

    r.db('EventsMK').table('Users').run(conn).then(function(cursor) {
        return cursor.toArray();
    }).each(function(user) {
        var userId = user.id;
        var accessToken = user.accessToken;

        console.log('fetching all for user', userId);

        return FB.events.list({
            userId: userId,
            accessToken: accessToken,
            type: 'not_replied'
        }).map(function(event) {
            var eventId = event.id;

            console.log('getting info for event', eventId);

            return FB.events.info({
                eventId: eventId,
                accessToken: accessToken
            });
        }, { concurrency: 1 }).then(function(fullEvents) {
            console.log('inserting', fullEvents.length, 'into db');
            return r.db('EventsMK').table('Events').insert(fullEvents).run(conn);
        });
    }).then(function() {
        process.exit(0);
    });
}).error(console.log.bind(console));
