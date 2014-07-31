var express = require('express');
var connect = require('connect');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var r = require('rethinkdb');

var db = require('./lib/db-service');

var strategy = new FacebookStrategy({
    clientID: "1471063303131642",
    clientSecret: "c5197e02fc6fad6537162806cf161f0b",
    callbackURL: "/auth/facebook/callback"
}, function(accessToken, refreshToken, profile, done) {
    db.user.insert(profile.id, profile._json.name, accessToken)/*.then(function() {
        return db.user.refreshEventList(profile.id);
    }).then(function() {
        return db.events.updateEvents();
    })*/.then(function() {
        done(null, profile);
    }).error(function() {
        done('error inserting user with id');
    });
});

passport.use(strategy);

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

var app = express();

app.use(connect.static(__dirname + '/static'));
app.use(connect.cookieParser());
app.use(connect.bodyParser());
app.use(connect.session({ secret: 'keyboard cat' }));
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
    db.events.comingInDays(14).then(function(events) {
        res.json(events);
    }).error(function() {
        res.json({ error: 'error' });
    });
});

console.log('Server started');
app.listen(9999);
