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
            return FB.events.all({
                userId: user.id,
                accessToken: user.accessToken
            });
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
        return r.db('EventsMK').table('Users').run(conn);
    }).then(function(cursor) {
        return cursor.toArray();
    }).then(function(users) {
        return Promise.all(users.map(function(user) {
            return DB.user.refreshEventList(user.id);
        }));
    });
};

DB.user.insert = function(id, name, accessToken) {
    return DB.connect().then(function() {
        return r.db('EventsMK').table('Users').insert({
            id: id,
            name: name,
            accessToken: accessToken,
            events: [],
            updated: Date.now(),
        }, { conflict: 'replace' }).run(conn);
    });
};

DB.user.get = function(id) {
    return DB.connect().then(function() {
        return r.db('EventsMK').table('Users').get(id).run(conn);
    });
};

DB.events.updateEvents = function() {
    return DB.connect().then(function() {
        return DB.events.getUniqueTokenEventPairs();
    }).then(function(pairs) {
        return Promise.all(pairs.map(function(pair) {
            return FB.events.info({ accessToken: pair.accessToken, eventId: pair.eventId });
        }));
    }).then(function(events) {
        return r.db('EventsMK').table('Events').insert(events, { conflict: "replace" }).run(conn);
    });
};

DB.events.removeSecret = function() {
    return DB.connect().then(function() {
        return r.db('EventsMK').table('Events').filter(r.row('privacy').eq('OPEN').not()).delete().run(conn);
    });
};

DB.events.removeCanceled = function() {
    var globalAccessToken;
    return DB.connect().then(function() {
        // Get Andrej T's account (to use his access token later)
        return r.db('EventsMK').table('Users').get('10204198449266512').run(conn);
    }).then(function(globalUser) {
        globalAccessToken = globalUser.accessToken;
    }).then(function() {
        // Return all event id's
        return r.db('EventsMK').table('Events').map(r.row('id')).run(conn);
    }).then(function(eventIds) {
        return Promise.all(eventIds.toArray().map(function(eventId) {
            return FB.events.info({
                accessToken: globalAccessToken,
                eventId: eventId
            }).catch(function() {
                // Removed events don't have status 200 so
                // FB.events.info throws
                console.log('Deleting', eventId);
                return r.db('EventsMK').table('Events').get(eventId).delete().run(conn);
            });
        }));
    });
};

DB.events.comingInDays = function(n) {
    return DB.connect().then(function() {
        return r.db('EventsMK').table('Events').filter(function(event) {
            var nDaysInFuture = new Date(Date.now() + (n * 24 * 60 * 60 * 1000));
            var fourHoursBeforeNow = new Date(Date.now() - (4 * 60 * 60 * 1000));
            var timezone = 'Europe/Skopje';
            return event('timezone').eq(timezone).and(
                r.ISO8601(event('start_time'),
                          {default_timezone: "+01:00"}).during(fourHoursBeforeNow, nDaysInFuture));
        }).pluck('id', 'location', 'name', 'start_time', 'venue', 'cover').run(conn).then(function(cursor) {
            return cursor.toArray();
        });
    });
};

module.exports = DB;
