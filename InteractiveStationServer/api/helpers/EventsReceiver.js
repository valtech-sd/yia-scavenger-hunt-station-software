'use strict';

const RPiMfrc522 = require('rpi-mfrc522');

// Local dependencies
const BoxState = require('../models/BoxState');

let mfrc522 = new RPiMfrc522();

class EventsReceiver {
  static enableEventReceivers() {
    // TODO: Add GPIO Scan event here to set Scan into BoxState, already imported into this file.
    // initialize the class instance then start the detect card loop
    mfrc522.init()
      .then(() => {
        rfidLoop();
      })
      .catch(error => {
        global.logger.info('RFID_ERROR: ' + error.message);
      });
  }
}

// loop method to start detecting a card
function rfidLoop() {
  console.log('Loop start...');
  rfidCardDetect()
    .catch(error => {
      global.logger.info('RFID_ERROR: ' + error.message);
    });
}

// delay then call loop again
function rfidRestartLoop() {
  setTimeout(rfidLoop, 1);
}

// call the rpi-mfrc522 methods to detect a card
async function rfidCardDetect() {
  // use the cardPresent() method to detect if one or more cards are in the PCD field
  if (!(await mfrc522.cardPresent())) {
    return rfidRestartLoop();
  }
  // use the antiCollision() method to detect if only one card is present and return the cards UID
  let uid = await mfrc522.antiCollision();
  if (!uid) {
    // there may be multiple cards in the PCD field
    global.logger.info('RFID: Multiple Card Collision');
    return rfidRestartLoop();
  }
  BoxState.recordGuestScan('01', 'A', uidToString(uid));
  await mfrc522.resetPCD()
  rfidRestartLoop();
}

// convert the array of UID bytes to a hex string
function uidToString(uid) {
  return uid.reduce((s, b) => { return s + (b < 16 ? '0' : '') + b.toString(16); }, '');
}

module.exports = EventsReceiver;
