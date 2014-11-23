#!/usr/local/bin/node

var DB = require('../lib/db-service');

DB.events.removeCanceled()
    .then(function() { process.exit(0); })
    .catch(function() { process.exit(1); });
