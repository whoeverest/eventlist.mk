var req = require('request');
var Promise = require('bluebird');
var req = Promise.promisifyAll(req);

var Events = {};

var counter = 0;

Events._genUrl = function(opts) {
    var userId = opts.userId;
    var type = opts.type;
    var accessToken = opts.accessToken;

    if (!userId) {
        throw new Error('userId not specified');
    }

    var url = 'https://graph.facebook.com/v2.0/' + userId + '/events';
    if (type) { url += '/' + type; }
    if (accessToken) { url += '?access_token=' + accessToken; }
    return url;
};

Events.list = function(opts) {
    var userId = opts.userId;
    var accessToken = opts.accessToken;
    var type = opts.type;

    var types = ['attending', 'created', 'maybe', 'not_replied', 'declined'];
    if (types.indexOf(type) === -1) {
        throw new Error('Invalid type ' + type);
    }

    var url = Events._genUrl({
        userId: userId,
        accessToken: accessToken,
        type: type
    });

    return req.getAsync(url).spread(function(res, body) {
        counter += 1; console.log(counter);
        return JSON.parse(body).data;
    });
};

Events.all = function(opts) {
    var userId = opts.userId;
    var accessToken = opts.accessToken;

    return Promise.all(['attending', 'created', 'maybe',
    'not_replied', 'declined'].map(function(type) {
        return Events.list({ userId: userId, accessToken: accessToken, type: type });
    })).then(function(events) {
        return events.reduce(function(ev1, ev2) { return ev1.concat(ev2); });
    });
};

Events.info = function(opts) {
    var eventId = opts.eventId;
    var accessToken = opts.accessToken;

    if (!eventId) {
        throw new Error('eventId not specified');
    }

    if (!accessToken) {
        throw new Error('missing access token');
    }

    var url = 'https://graph.facebook.com/v2.0/' + eventId;
    url += '?access_token=' + accessToken;

    return req.getAsync(url).spread(function(req, body) {
        counter += 1; console.log(counter);
        return JSON.parse(body);
    });
};

var User = {};

User.info = function(opts) {
    var accessToken = opts.accessToken;
    var userId = opts.userId;

    var url = 'https://graph.facebook.com/v2.0/' + userId;
    url += '?access_token=' + accessToken;

    return req.getAsync(url).spread(function(req, body) {
        counter += 1; console.log(counter);
        return JSON.parse(body);
    });
};

module.exports = {events: Events, user: User };