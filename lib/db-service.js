var r = require('rethinkdb');
var FB = require('./fb-service');
var Promise = require('bluebird');

var dbName = 'EventsMK';

var DB = { events: {}, user: {} };

DB.events.getUniqueTokenEventPairs = function(conn) {
    return r.db('EventsMK').table('Users').concatMap(function(user) {
        return user('events').map(function(event) {
            return { accessToken: user('accessToken'), eventId: event };
        });
    }).group('eventId').ungroup().concatMap(function(g) {
        return g('reduction').slice(0, 1);
    }).run(conn);
};

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

DB.user.refreshEventListAll = function(conn) {
    return r.db('EventsMK').table('Users').run(conn).then(function(cursor) {
        return cursor.toArray();
    }).then(function(users) {
        return users.map(function(user) {
            return DB.user.refreshEventList(conn, user.id);
        });
    });
};

DB.events.updateEvents = function(conn, pairs) {
    return Promise.all(pairs.map(function(pair) {
        return FB.events.info({
            accessToken: pair.accessToken,
            eventId: pair.eventId
        });
    })).then(function(events) {
        return r.db('EventsMK').table('Events').insert(events).run(conn);
    });
};

module.exports = DB;
