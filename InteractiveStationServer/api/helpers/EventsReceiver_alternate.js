'use strict';

// Package Dependencies
const Mfrc522 = require("mfrc522-rpi");
const SoftSPI = require("rpi-softspi");

const softSPI = new SoftSPI({
  clock: 23, // pin number of SCLK
  mosi: 19, // pin number of MOSI
  miso: 21, // pin number of MISO
  client: 24 // pin number of CS
});

// GPIO 24 can be used for buzzer bin (PIN 18), Reset pin is (PIN 22).
const mfrc522 = new Mfrc522(softSPI).setResetPin(22).setBuzzerPin(18);

// Local dependencies
const BoxState = require('../models/BoxState');

class EventsReceiver {
  static enableEventReceivers() {
    // initialize the class instance then start the detect card loop
    setInterval(function() {
      //# reset card
      mfrc522.reset();

      //# Scan for cards
      let response = mfrc522.findCard();
      if (!response.status) {
        console.log("No Card");
        return;
      }
      console.log("Card detected, CardType: " + response.bitSize);

      //# Get the UID of the card
      response = mfrc522.getUid();
      if (!response.status) {
        console.log("UID Scan Error");
        return;
      }
      //# If we have the UID, continue
      const uidHex = response.data;
      const uid = uidHex[0].toString(16) + uidHex[1].toString(16) + uidHex[2].toString(16) + uidHex[3].toString(16);

      //# Select the scanned card
      const memoryCapacity = mfrc522.selectCard(uidHex);
      // console.log("Card Memory Capacity: " + memoryCapacity);

      //# This is the default key for authentication
      const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

      //# Authenticate on Block 8 with key and uid
      if (!mfrc522.authenticate(8, key, uidHex)) {
        global.logger.info('RFID_ERROR: Data Authentication Error');
        return;
      }

      var data = mfrc522.getDataForBlock(8) + ',' + mfrc522.getDataForBlock(9) + ',' + mfrc522.getDataForBlock(10);
      var dataArr = data.split(',');
      data = new Buffer.from(dataArr).toString();
      data = JSON.parse(data);

      //# Stop
      mfrc522.stopCrypto();
    }, 500);
  }
}

module.exports = EventsReceiver;
