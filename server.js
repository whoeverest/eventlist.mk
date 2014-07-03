var express = require('express');
var connect = require('connect');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var r = require('rethinkdb');

var RETHINKHOST = 'localhost';

var conn;
r.connect({ host: RETHINKHOST, port: 28015 }, function(err, connection) {
    if (err) { throw err; }
    conn = connection;
    console.log('Connected to Rethink');
});

var strategy = new FacebookStrategy({
    clientID: "1471063303131642",
    clientSecret: "c5197e02fc6fad6537162806cf161f0b",
    callbackURL: "/auth/facebook/callback"
}, function(accessToken, refreshToken, profile, done) {
    console.log('id', profile.id, 'access token', accessToken);

    console.log(conn);

    r.db('EventsMK').table('Users').insert({
        id: profile.id,
        accessToken: accessToken
    }).run(conn, function(err, res) {
        if (err) { throw err; }
        console.log(res);
    });

    done(null, profile);
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
            successRedirect: '/success',
            failureRedirect: '/error' }));

app.get('/success', function(req, res) {
    var id = req.session.passport.user.id;
    var displayName = req.session.passport.user.displayName;
    res.end('logged in as ' + id);
});

app.get('/error', function(req, res) {
    res.end('error');
});

app.get('/events', function(req, res) {
    r.db('EventsMK').table('Events').run(conn, function(err, cursor) {
        if (err) { throw err; }
        cursor.toArray(function(err, events) {
            res.json(events);
        });
    });
});

console.log('Server started');
app.listen(9999, '0.0.0.0');
