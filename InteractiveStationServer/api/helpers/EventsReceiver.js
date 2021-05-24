'use strict';

// Package Dependencies
const mfrc522 = new (require('rpi-mfrc522'))();

// Local dependencies
const BoxState = require('../models/BoxState');

class EventsReceiver {
  static enableEventReceivers() {
    // initialize the class instance then start the detect card loop
    mfrc522
      .init()
      .then(() => {
        rfidLoop();
      })
      .catch((error) => {
        global.logger.info('RFID_ERROR: ' + error.message);
      });
  }
}

/**
 * loop method to start detecting a card
 */
function rfidLoop() {
  rfidCardDetect().catch((error) => {
    global.logger.info('RFID_ERROR: ' + error.message);
  });
}

/**
 * delay then call loop again
 *
 * TODO: Explain why we delay the call to start the RFID Loop.
 */
function rfidRestartLoop() {
  setTimeout(rfidLoop, 1);
}

/**
 * call the rpi-mfrc522 methods to detect a card
 *
 * @returns {Promise<void>}
 */
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
  // If we have a BoxState already with a SCAN UUID, we don't want to override BoxState, but instead we want to ignore this scan!
  const currentBoxState = BoxState.getState();
  if (currentBoxState.guestTokenId) {
    // We already have a guestTokenId, so we want to ignore this scan.
    global.logger.info(
      `RFID: Scan deceived while BoxState has a guestTokenId already. Ignoring scan for Token="${uidToString(
        uid
      )}"`
    );
  } else {
    // We don't have guestTokenId, so we accept this new scan and set BoxState for the guest.
    // TODO: Change recordGuestScan call from hardcoded values to something coming from the SCAN.
    BoxState.recordGuestScan('1', 'A', uidToString(uid));
  }
  // Reset and restart the loop to scan future cards
  await mfrc522.resetPCD();
  rfidRestartLoop();
}

// convert the array of UID bytes to a hex string
function uidToString(uid) {
  return uid.reduce((s, b) => {
    return s + (b < 16 ? '0' : '') + b.toString();
  }, '');
}

module.exports = EventsReceiver;
