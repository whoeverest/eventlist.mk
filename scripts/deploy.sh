#!/bin/bash
set -e

cd $NACDIR
refspec=$1
if [ -z "$refspec" ]
then
    refspec="master"
fi
git fetch origin && git stash && git checkout origin/$refspec
npm install
nac $NACNAME restart
