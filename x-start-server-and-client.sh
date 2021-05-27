#!/bin/bash

# Start the server
cd /home/pi/Projects/YIA/yia-scavenger-hunt-station-software/InteractiveStationServer || exit
nohup npm start -- &

# Change into client and start that
cd /home/pi/Projects/YIA/yia-scavenger-hunt-station-software/InteractiveStationHtmlClient || exit
nohup npm start -- &
