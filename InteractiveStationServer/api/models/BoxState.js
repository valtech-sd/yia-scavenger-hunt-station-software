'use strict';

// Project Dependencies
const QuestConfig = require('../models/QuestConfig');

// Local instances of globals
const config = global.config;

// Pull from config
const INTERNAL_BOX_ID = config.get('BOX_ID');
const INTERNAL_SEQUENCE_ID = config.get('SEQUENCE_ID');

class BoxState {
  // Private Instance variable to hold our Box State
  static #BoxState = {
    BOX_ID: INTERNAL_BOX_ID,
    SEQUENCE_ID: INTERNAL_SEQUENCE_ID,
    supportingMedia: null,
    questItem: null,
    lastUpdated: Math.floor(new Date().getTime() / 1000.0),
    // To hold what we scanned from the guest's token
    guestVariantId: null,
    guestSequenceId: null,
    guestTokenId: null,
  };

  /**
   * Sets BoxState. Should pass non-null values most times!
   * If BOX_ID is passed, it will override the INTERNAL BOX_ID in the config, otherwise, INTERNAL BOX_ID is used.
   * Regardless of BOX_ID being passed, it is set to something (internal or passed).
   * Then, the Quest Config is also loaded for the given BOX_ID (supportingMedia).
   * Also, if variantId && SEQUENCE_ID are passed, then the Quest Config will also be loaded into the BoxState
   * matching the BOX_ID, variantId, SEQUENCE_ID.
   *
   * @param boxId
   * @param sequenceId
   * @param guestSequenceId
   * @param guestVariantId
   * @param guestTokenId
   */
  static setBoxState(
    boxId,
    sequenceId,
    guestSequenceId,
    guestVariantId,
    guestTokenId
  ) {
    this.#BoxState.BOX_ID = boxId;
    this.#BoxState.SEQUENCE_ID = sequenceId;
    this.#BoxState.lastUpdated = Math.floor(new Date().getTime() / 1000.0);
    // To hold what we scanned from the guest's token
    this.#BoxState.guestVariantId = guestVariantId;
    this.#BoxState.guestSequenceId = guestSequenceId;
    this.#BoxState.guestTokenId = guestTokenId;

    // Now, find the supporting media from config for this box
    this.#BoxState.supportingMedia = QuestConfig.getSupportingMediaForBox(
      boxId,
      sequenceId
    );
    // Now, try to find the questItem for this box, sequence, variant
    this.#BoxState.questItem = QuestConfig.getQuestItemForBox(
      boxId,
      guestVariantId,
      sequenceId // important that we use the box SEQUENCE_ID and not guestSequenceId
    );

    // Log
    const logDetails = {
      boxState: this.#BoxState,
    };
    global.logger.info(logDetails, 'setBoxState');

    // Return
    return this.#BoxState;
  }

  /**
   * Records a Scan event capturing the guestSequenceId and guestvariantId into the BoxState.
   * @param guestSequenceId
   * @param guestVariantId
   * @param guestTokenId
   */
  static recordGuestScan(guestSequenceId, guestVariantId, guestTokenId) {
    this.#BoxState.lastUpdated = Math.floor(new Date().getTime() / 1000.0);
    // To hold what we scanned from the guest's token
    this.#BoxState.guestVariantId = guestVariantId;
    this.#BoxState.guestSequenceId = guestSequenceId;
    this.#BoxState.guestTokenId = guestTokenId;

    // Log
    const logDetails = {
      boxState: this.#BoxState,
    };
    global.logger.info(logDetails, 'recordGuestScan');

    // Return
    return this.#BoxState;
  }

  /**
   * Return the current BoxState
   */
  static getState() {
    return this.#BoxState;
  }

  /**
   * Clears the current BoxState - sets BOX_ID to the internal in the box main config.
   */
  static clearState() {
    // Clear all the things
    this.#BoxState.BOX_ID = INTERNAL_BOX_ID;
    this.#BoxState.SEQUENCE_ID = INTERNAL_SEQUENCE_ID;
    // Now, find the supporting media from config for this box
    this.#BoxState.supportingMedia = QuestConfig.getSupportingMediaForBox(
      INTERNAL_BOX_ID,
      INTERNAL_SEQUENCE_ID
    );
    this.#BoxState.questItem = null;
    this.#BoxState.lastUpdated = Math.floor(new Date().getTime() / 1000.0);
    // To hold what we scanned from the guest's token
    this.#BoxState.guestVariantId = null;
    this.#BoxState.guestSequenceId = null;
    this.#BoxState.guestTokenId = null;

    // Log
    const logDetails = {
      boxState: this.#BoxState,
    };
    global.logger.info(logDetails, 'clearState');

    // Return
    return this.#BoxState;
  }
}

module.exports = BoxState;
