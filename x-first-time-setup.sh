#!/bin/bash

# Update APT
sudo apt-get update /y
sudo apt-get full-upgrade /y

# Install GIT LFS
curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
sudo apt-get install git-lfs -y
git lfs install

# Install NodeJS
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup RASPI-CONFIG SPI
# TODO: Find non-interactive way to do 'sudo raspi-config' and enable OPTION 3 'enable SPI'

#
# Install Packages
#

# Client
cd InteractiveStationHtmlClient || exit
npm install

# Server
cd ../InteractiveStationServer || exit
npm install

# Back to root
cd ..

