#!/bin/bash

# Update APT
sudo apt-get update
sudo apt-get full-upgrade

# Install NodeJS
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs

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

