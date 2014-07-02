var r = require('rethinkdb');
var FB = require('./fb-service');

var dbName = 'EventsMK';

var DB = { user: {} };

DB.user.refreshEventList = function(conn, userId) {
    var eventList = [];
    return r.db('EventsMK').table('Users').get(userId).run(conn).then(function(user) {
        return FB.events.all({ userId: user.id, accessToken: user.accessToken });
    }).then(function(events) {
        return events.map(function(ev) {
            return ev.id;
        });
    }).then(function(events) {
        eventList = events;
        return r.db(dbName).table('Users').get(userId).update({ events: events }).run(conn);
    }).then(function() {
        return eventList;
    });
};

DB.user.expandEventInfo = function(conn, userId) {
    var eventsWithFullInfo = [];
    return r.db('EventsMK').table('Users').get(userId).run(conn).then(function(user) {
        if (!user.events) { user.events = []; }
        return user.events.map(function(eventId) {
            return FB.events.info({ accessToken: user.accessToken, eventId: eventId });
        });
    }).all().then(function(events) {
        eventsWithFullInfo = events;
        return r.db(dbName).table('Events').insert(events, { upsert: true }).run(conn);
    }).then(function() {
        return eventsWithFullInfo;
    });
};

module.exports = DB;
