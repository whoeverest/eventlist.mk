#!/bin/bash

/usr/local/bin/rethinkdb-dump -c localhost:28015 -f /home/whoeverest/eventlist-backups/eventlist_$(date +"%Y-%M-%d_%H:%M")_tar.gz
