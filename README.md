# YIA Scavenger Hunt Station Software - README

## Summary

This repository is composed of two parts:

- Interactive Station Server - the server side API that runs on the Stations. See the **InteractiveStationServer** directory and its README.md.
- Interactive Station Client - the client side HTML that interacts with the server, and the guest to carry out the experience. See the **InteractiveStationHtmlClient** directory and its README.md.

See the respective directories each of which have their own documentation.

## Installing Server and Client to stations

- Manually run the script **x-first-time-setup.sh** from the repo. You'll need to manually copy its contents. It should be run BEFORE trying to do a first GIT CLONE (so that GIT LFS is installed.)
- Git clone this repo into a directory of choice.
- Set the station (box) number with **sudo ./x-set-box-no.sh [1..10]**.

## Running Server and Client

The root of where this project was cloned has a script **x-start-server-and-client.sh**. Simply execute that.

To stop the server and client:
```bash
# get a list of the processes
$ ps aux | egrep "http|node"
# kill all the PIDs that came out in the result (typically there are 4)
kill 1234 1233 4567 9876
```
