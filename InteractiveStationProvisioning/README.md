# Interactive Station Provisioning

## Station Login

- Access via SSH with `ssh pi@192.168.254.xx`
  - password Valtech!
  - replace the IP address above as necessary for your network

## Station Software Dependencies

This repository includes a script for FIRST TIME SETUP that should handle all the dependencies. See **x-first-time-setup.sh**.

> **Note:** As of the last update of this readme, there might be some additional dependencies not mentioned here or covered in first time setup. We do have an IMAGE of a working BOX. See below for how to restore a BOX IMAGE. 

- Update apt-get and packages

  ```bash
  $ sudo apt-get update
  $ sudo apt-get full-upgrade
  ```
- Install NodeJS v14.16

  ```bash
  $ curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
  $ sudo apt-get install -y nodejs
  ```

  You can test with `node --version` which should return 14.x.

## Station initial setup:

> **Note:** As of the last update of this readme, there might be some additional dependencies not mentioned here or covered in first time setup. We do have an IMAGE of a working BOX. See below for how to restore a BOX IMAGE.

The following should be performed on a new station running a stable Raspbian. This does require INTERNET ACCESS and assumes the REPO is PUBLIC.

1. Install GIT LFS so that all media properly downloads when you use GIT.
   ```bash
   # Install GIT LFS
   curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
   sudo apt-get install git-lfs -y
   git lfs install
   ```
1. Create a directory for the **pi** user **~/Projects/YIA/yia-scavenger-hunt-station-software/**
1. Switch to that directory then clone this entire repo to that folder with `git clone https://github.com/valtech-sd/yia-scavenger-hunt-station-software .` (the ending period is VERY important.)
1. From inside that directory, run **x-first-time-setup.sh**
1. From inside that directory, run **x-set-box-no.sh 99** (where you replace 99 with the BOX NUMBER!)
1. Setup Station Autoboot & Kiosk Mode (see the below section for the files to create and their content.)
1. Reboot with `sudo reboot`.

When you're done, the station should boot and go into full screen Chromium with the IDLE video playing for the station.=

### Station Autoboot & Kiosk Mode

The stations autoboot the Station Server, Station Client Web Server and startup Chromium in Kiosk mode (with autoplay enabled to not require user interaction.)

This is handled via the following.

#### Autostart the Server and Client Web Server

The Server and Client Web Server are started using the Ubuntu Desktop Autostart feature.

Specifically, the file **~/.config/autostart/hunt.desktop** calls our **x-start-server-and-client.sh** script in the root of the project and contains:

```bash
[Desktop Entry]
Encoding=UTF-8
Name=Scavenger Hunt
Comment=Server and Client Processes
Exec=/home/pi/Projects/YIA/yia-scavenger-hunt-station-software/x-start-server-and-client.sh
Type=Application
```

#### Autostart Chromium in Kiosk Mode

Chromium is also started using the Ubuntu Desktop Autostart feature.

Specifically, the file **~/.config/autostart/kiosk.desktop** calls a script **/usr/share/xsessions/chromeKiosk.sh** that starts chromium. The two files contain the following:

**~/.config/autostart/kiosk.desktop**

```bash
[Desktop Entry]
Encoding=UTF-8
Name=Kiosk Mode
Comment=Chromium Kiosk Mode
Exec=/usr/share/xsessions/chromeKiosk.sh
Type=Application
```

**/usr/share/xsessions/chromeKiosk.sh** (make this `CHMOD +x`).

```bash
#!/bin/bash
xscreensaver -nosplash &
cat ~/.config/chromium/Local\ State | perl -pe "s/\"bottom.*/\"bottom\": $(xrandr | grep \* | cut -d' ' -f4 | cut -d'x' -f2),/" > ~/.config/chromium/Local\ Sta$
cat ~/.config/chromium/Local\ State | perl -pe "s/\"right.*/\"right\": $(xrandr | grep \* | cut -d' ' -f4 | cut -d'x' -f1),/" > ~/.config/chromium/Local\ State
while true; do chromium-browser http://localhost:8080 %u --kiosk --start-maximized --autoplay-policy=no-user-gesture-required; sleep 10s; done
```

## Station Code Update

To update the code on the stations, run the script **x-update-from-repo.sh**. This does require INTERNET ACCESS and assumes the REPO is PUBLIC.

After the update, reboot the box with `sudo reboot`.

## Station Image Restore

To restore a working image to a station:

1. Download the image from https://drive.google.com/drive/u/0/folders/1Cn-pArw7gbfKPETaNsvD2j3ZAUK_kMJK 
1. Unzip the image.
1. Plug the PI's SD card into your Mac.
1. Use `diskutil list` to figure out the mount point for the SD card. For example, this might be something like `/dev/disk99`. 
1. Unmount it with `diskutil unmountDisk /dev/disk99`. (replace the destination with yours!)
1. Copy the image over with `sudo dd if=minimal-kiosk.img of=/dev/disk99`. (replace the destination with yours!)
1. After, pop the SD card back into the PI and boot.
1. Once it boots, SSH into it and update `/etc/environment` to set the proper **BOX_ID** for the box. Also, verify that the PI user's .bashrc is not also setting BOX_ID!