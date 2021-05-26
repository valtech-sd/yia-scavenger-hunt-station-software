#!/bin/bash

# Assumes that the current directory is already GIT connected!

# Update from Git
git pull

# Update packages

# Client
cd InteractiveStationHtmlClient || exit
npm install

# Server
cd ../InteractiveStationServer || exit
npm install

# Back to root
cd ..

