var req = require('request');
var Promise = require('bluebird');
var req = Promise.promisifyAll(req);

var Events = {};

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
        return JSON.parse(body).data;
    });
};

Events.info = function(opts) {
    var eventId = opts.eventId;
    var accessToken = opts.accessToken;

    if (!eventId) {
        throw new Error('eventId not specified');
    }

    var url = 'https://graph.facebook.com/v2.0/' + eventId;
    if (accessToken) { url += '?access_token=' + accessToken; }

    return req.getAsync(url).spread(function(req, body) {
        return JSON.parse(body);
    });
};

module.exports.events = Events;
