#!/usr/local/bin/node

/**

1. Fetch users (tokens) that haven't been updated in more than X time
2. For each user, fetch event feeds: attending, created, maybe, not_replied,
   declined.
3. For each user, keep a list of (event_id: 1, event_type: not_replied) pairs.
4. Add each event to the Events table, with minimal info

1. Fetch events that that haven't been updated for more than X time
2. For each event, get event data and save in DB
3. Add each venue to the Venues table

1. For each venue that hasn't been updated in more than X time,
   fetch data and update DB

---

To keep a user refreshed, you need to fetch his lists of events
To keep an event refreshed, you need to fetch its info
To keep a venue refreshed, you need to fetch its info

*/

var DB = require('../lib/db-service');

DB.user
    .refreshEventListAll()
    .then(DB.events.getUniqueTokenEventPairs)
    .then(DB.events.updateEvents)
    .then(function() { console.log('done', new Date()); })
    .catch(console.log.bind(console));
