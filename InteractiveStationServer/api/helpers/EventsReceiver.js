'use strict';

// Package Dependencies
const Mfrc522 = require('mfrc522-rpi');
const SoftSPI = require('rpi-softspi');

const softSPI = new SoftSPI({
  clock: 23, // pin number of SCLK
  mosi: 19, // pin number of MOSI
  miso: 21, // pin number of MISO
  client: 24, // pin number of CS
});

// GPIO 24 can be used for buzzer bin (PIN 18), Reset pin is (PIN 22).
const mfrc522 = new Mfrc522(softSPI).setResetPin(22).setBuzzerPin(18);

// Local dependencies
const BoxState = require('../models/BoxState');

class EventsReceiver {
  static enableEventReceivers() {
    // initialize the class instance then start the detect card loop
    setInterval(function () {
      //# reset card
      mfrc522.reset();

      //# Scan for cards
      let response = mfrc522.findCard();
      if (!response.status) {
        // console.log("No Card");
        return;
      }

      //# Get the UID of the card
      response = mfrc522.getUid();
      if (!response.status) {
        global.logger.info('RFID_READ: UID Scan Error');
        return;
      }
      //# If we have the UID, continue
      const uidHex = response.data;
      const uid = uidHexToUidString(uidHex);

      global.logger.info(
        'RFID_READ: Card detected: ' + uid + ', CardType: ' + response.bitSize
      );

      // If we have a BoxState already with a SCAN UUID, we don't want to override BoxState, but instead we want to ignore this scan!
      const currentBoxState = BoxState.getState();
      if (currentBoxState.guestTokenId) {
        // We already have a guestTokenId, so we want to ignore this scan.
        global.logger.info(
          `RFID_READ: Card read detected while BoxState has a guestTokenId already. Ignoring scan for card: ` +
            uid
        );
      } else {
        // Get data for the card. We expect the data object ends up with the properties:
        // sequenceId, variantId
        const data = getData(uidHex);
        // We set BoxState only if we indeed read the card data, otherwise, the card was not encoded
        // or there was some error, so we can't set BoxState properly including Sequence + Variant!
        if (data) {
          // We don't have guestTokenId, so we accept this new scan and set BoxState for the guest.
          BoxState.recordGuestScan(data['sequenceId'], data['variantId'], uid);
        }
      }
      //# Stop
      mfrc522.stopCrypto();
    }, 500);
  }
}

// convert the array of UID bytes to a hex string
function uidHexToUidString(uidHex) {
  const uid =
    uidHex[0].toString(16) +
    uidHex[1].toString(16) +
    uidHex[2].toString(16) +
    uidHex[3].toString(16) +
    uidHex[4].toString(16);
  return uid;
}

// process RFID card data
function getData(uidHex) {
  // Select the scanned card
  const memoryCapacity = mfrc522.selectCard(uidHex);
  // console.log("Card Memory Capacity: " + memoryCapacity);

  // This is the default key for authentication
  const key = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff];

  // Authenticate on Block 8 with key and uid
  if (!mfrc522.authenticate(8, key, uidHex)) {
    global.logger.info('RFID_ERROR: Data Authentication Error');
    return;
  }

  let data =
    mfrc522.getDataForBlock(8) +
    ',' +
    mfrc522.getDataForBlock(9) +
    ',' +
    mfrc522.getDataForBlock(10);
  const dataArr = data.split(',');
  data = new Buffer.from(dataArr).toString();
  data = JSON.parse(data);
  return data;
}

// // get the sequenceId from the current card
// function getSequenceID(data) {
//   return data.sequenceId;
// }
//
// //get the variantId from the current card
// function getVariantId(data) {
//   return data.variantId;
// }

module.exports = EventsReceiver;
