#!/bin/bash

# Update APT
sudo apt-get update /y
sudo apt-get full-upgrade /y

# Install NodeJS
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs /y

# Setup RASPI-CONFIG SPI
# TODO: Find non-interactive way to do 'sudo raspi-config' and enable OPTION 3 'enable SPI'

#
# Install Packages
#

# Client
cd InteractiveStationHtmlClient
npm install

# Server
cd ../InteractiveStationServer
npm install

# Back to root
cd ..

