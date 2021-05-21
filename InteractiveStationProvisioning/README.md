# Interactive Station Provisioning

## Station Login

- Access via SSH with `ssh pi@192.168.254.xx`
  - password Valtech!
  - replace the IP address above as necessary for your network

## Station Software Dependencies

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
