var express = require('express');
var connect = require('connect');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var fs = require('fs');

var config = require('./config');
var db = require('./lib/db-service');
var rss = require('./lib/rss');

var strategy = new FacebookStrategy({
    clientID: config.fb.clientID,
    clientSecret: config.fb.clientSecret,
    callbackURL: "/auth/facebook/callback"
}, function(accessToken, refreshToken, profile, done) {
    db.user.insert(profile.id, profile._json.name, accessToken).then(function() {
        return db.user.get(profile.id).then(function(user) {
            done(null, user);
        });
    }).error(function() {
        done('error inserting user with id');
    });
});

passport.use(strategy);

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    db.user.get(user.id).then(function(user) {
        done(null, user);
    }).error(function() {
        done('Error deserializing user');
    });
});

var app = express();

app.use(connect.static(__dirname + '/static'));
app.use(connect.cookieParser());
app.use(connect.bodyParser());
app.use(connect.session({
    secret: config.express.secret,
    store: new RedisStore()
}));
app.use(passport.initialize());
app.use(passport.session());


app.get('/auth/facebook',
        passport.authenticate('facebook', { scope: ['user_events'] }));
app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/?message=addEventsSuccess',
            failureRedirect: '/?message=addEventsFail' }));

app.get('/error', function(req, res) {
    res.end('error');
});

app.get('/events', function(req, res) {
    db.events.comingInDays().then(function(events) {
        res.json(events);
    }).error(function(err) {
        console.log(err);
        res.json({ error: 'error fetching events' });
    });
});

app.get('/events/:id', function(req, res) {
    db.events.withId(req.params.id).then(function(event) {
        res.json(event);
    }).error(function(err) {
        console.log(err);
        res.json({ error: 'error fetchin one event' });
    });
});

app.get('/stats', function(req, res) {
    db.general.stats().then(function(stats) {
        res.json(stats);
    }).error(function(err) {
        console.log(err);
        res.json({ error: 'error fetching stats' });
    });
});

app.get('/', function(req, res) {
    var oneMonth = Date.now() - (30 * 24 * 60 * 60 * 1000);

    var tokenIsOld;
    try {
        tokenIsOld = req.session.passport.user.updated < oneMonth;
    } catch (e) {
        tokenIsOld = false;
    }

    if (tokenIsOld) {
        res.redirect('/auth/facebook');
    } else {
        res.end(fs.readFileSync('./index.html'));
    }
});

app.get('/rss', function(req, res) {
    rss().then(function(feedString) {
        res.end(feedString);
    });
});

console.log('Server started');
app.listen(9999);
