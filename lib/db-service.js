var r = require('rethinkdb');
var FB = require('./fb-service');
var Promise = require('bluebird');

var RETHINKHOST = 'localhost';

var DB = { events: {}, user: {} };

var conn;
DB.connect = function() {
    if (conn) {
        return Promise.resolve(conn);
    } else {
        return r.connect({ host: RETHINKHOST, port: 28015 }).then(function(connection) {
            console.log('Connected to Rethink');
            conn = connection;
            return connection;
        });
    }
};

DB.events.getUniqueTokenEventPairs = function() {
    return DB.connect().then(function() {
        return r.db('EventsMK').table('Users').concatMap(function(user) {
            return user('events').map(function(event) {
                return { accessToken: user('accessToken'), eventId: event };
            });
        }).group('eventId').ungroup().concatMap(function(g) {
            return g('reduction').slice(0, 1);
        }).run(conn);
    });
};

DB.user.refreshEventList = function(userId) {
    return DB.connect().then(function() {
        var eventList = [];
        return r.db('EventsMK').table('Users').get(userId).run(conn).then(function(user) {
            return FB.events.all({ userId: user.id, accessToken: user.accessToken });
        }).then(function(events) {
            return events.map(function(ev) {
                return ev.id;
            });
        }).then(function(events) {
            eventList = events;
            return r.db('EventsMK').table('Users').get(userId).update({ events: events }).run(conn);
        }).then(function() {
            return eventList;
        });
    });
};

DB.user.refreshEventListAll = function() {
    return DB.connect().then(function() {
        return r.db('EventsMK').table('Users').run(conn).then(function(cursor) {
            return cursor.toArray();
        }).then(function(users) {
            return users.map(function(user) {
                return DB.user.refreshEventList(user.id);
            });
        });
    });
};

DB.user.insert = function(id, accessToken) {
    return DB.connect().then(function() {
        return r.db('EventsMK').table('Users').insert({
            id: id,
            accessToken: accessToken,
            events: []
        }).run(conn);
    });
};

DB.events.updateEvents = function(pairs) {
    return DB.connect().then(function() {
        return Promise.all(pairs.map(function(pair) {
            return FB.events.info({
                accessToken: pair.accessToken,
                eventId: pair.eventId
            });
        })).then(function(events) {
            return r.db('EventsMK').table('Events').insert(events).run(conn);
        });
    });
};

DB.events.comingInDays = function(n) {
    return DB.connect().then(function() {
        return r.db('EventsMK').table('Events').filter(function(event) {
            var now = new Date(Date.now());
            var nDaysInFuture = new Date(Date.now() + n * 24 * 60 * 60 * 1000);
            return r.ISO8601(event('start_time')).during(now, nDaysInFuture);
        }).run(conn).then(function(cursor) {
            return cursor.toArray();
        });
    });
};

module.exports = DB;
