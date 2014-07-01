#!/bin/bash

cd $NACDIR
refspec=$1
if [ -z "$refspec" ]
then
    refspec="master"
fi
git fetch upstream && git stash && git checkout upstream/$refspec
npm install
nac $NACNAME restart
