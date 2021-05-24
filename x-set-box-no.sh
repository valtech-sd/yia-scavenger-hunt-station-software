#!/bin/bash

# path to where this script stored (we assume dependent scripts are here too)
BASEDIR=$(dirname $0)

# check for required parameter
if [ $# -eq 0 ]
  then
    echo "Box No must be supplied!"
    exit 1
fi

echo "BOX_ID will be set to $1 (by adding to ~/.bashrc"
# Wait for the user to press any KEY to proceed or allow them to Ctrl+C
read -n1 -rsp $'Press any key to continue or Ctrl+C to exit...\n'

echo "\n# Interactive Server Software" >> ~/.bashrc
echo "export BOX_ID=$1" >> ~/.bashrc

echo "Be sure to start a new sell to see the new value."
