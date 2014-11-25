#!/bin/bash

/usr/local/bin/rethinkdb-dump -c localhost:28015 -f /home/whoeverest/eventlist-backups/eventlist_$(date --iso-8601="minutes")_tar.gz
