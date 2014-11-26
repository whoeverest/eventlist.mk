var express = require('express');
var connect = require('connect');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var fs = require('fs');

var db = require('./lib/db-service');

var strategy = new FacebookStrategy({
    clientID: "1471063303131642",
    clientSecret: "c5197e02fc6fad6537162806cf161f0b",
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
    secret: 'OO*gh84f2oiyfu28g24oiugfvy2498gy2498g2y4iugfev',
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
        res.json({ error: 'error' });
    });
});

app.get('/stats', function(req, res) {
    db.general.stats().then(function(stats) {
        res.json(stats);
    }).error(function() {
        console.log('err');
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

console.log('Server started');
app.listen(9999);
