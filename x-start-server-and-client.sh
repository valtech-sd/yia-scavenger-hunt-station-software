#!/bin/bash

# Start the server
cd InteractiveStationServer || exit
nohup npm start -- &

# Change into client and start that
cd ../InteractiveStationHtmlClient || exit
nohup npm start -- &

