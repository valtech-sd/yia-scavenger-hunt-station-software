'use strict';

// Package dependencies
require('json5/lib/register'); // Allows us to require JSON5 files!
const path = require('path');
const appRoot = require('app-root-path');
const Ajv = require('ajv');
const ajv = new Ajv();
const util = require('util');

class QuestConfig {
  // Instance Property for the QuestConfig (static)
  static #QuestConfig = null;

  /**
   * Return the Quest Config. Will be loaded and validated if not previously loaded from the config file.
   * @returns {null}
   */
  static getQuestConfig() {
    // Do we have a static config loaded?
    if (!this.#QuestConfig) {
      this.#QuestConfig = this.#loadQuestConfigFromFileAndValidate();
    }
    return this.#QuestConfig;
  }

  /**
   * Returns a Quest Config object that only contains details for a single box
   */
  static getQuestItemForBox(boxId, variantId, sequenceId) {
    // SANITY: All the inputs are needed or else we return an empty config
    if (!boxId || !variantId || !sequenceId) {
      return null;
    }
    // ASSERT: We have all the parameters, so let's find the right questItem

    // Pull the config
    const questConfig = this.getQuestConfig();
    // Filter the questItems
    const questItemForBox = questConfig['questItems'].filter((item) => {
      return (
        item.BOX_ID === boxId &&
        item.variantId === variantId &&
        item.SEQUENCE_ID === sequenceId
      );
    });
    // Return what we found - but the FIRST since we only support ONE per Box+Variant+Sequence
    return Array.isArray(questItemForBox) && questItemForBox.length > 0
      ? questItemForBox[0]
      : null;
  }

  /**
   * Get the supporting media config for a given BOX_ID.
   *
   * @param boxId
   * @param sequenceId
   * @returns {{}}
   */
  static getSupportingMediaForBox(boxId, sequenceId) {
    // SANITY: All the inputs are needed or else we return an empty config
    if (!boxId || !sequenceId) {
      return null;
    }
    const questConfig = this.getQuestConfig();
    // Filter the supportingMedia
    return questConfig.supportingMedia.filter((item) => {
      return item.BOX_ID === boxId && item.SEQUENCE_ID === sequenceId;
    });
  }

  /**
   * Load, parse and validate the JSON5 config file.
   * @returns {any}
   */
  static #loadQuestConfigFromFileAndValidate() {
    try {
      // Pull out the Quest Config and Schema Paths from our App Config
      const questConfigFilePath = path.join(
        appRoot.path,
        global.config.get('questConfigFilePath')
      );
      const questConfigSchemaFilePath = path.join(
        appRoot.path,
        global.config.get('questConfigSchemaFilePath')
      );
      // Bring it in (as an object, using NodeJS require, empowered for JSON5)
      const questConfig = require(questConfigFilePath);
      const questConfigSchema = require(questConfigSchemaFilePath);
      // Validate questConfig for JSON Schema
      const isValidQuestConfig = ajv.validate(questConfigSchema, questConfig);
      if (!isValidQuestConfig) {
        throw new Error(
          `QuestConfig schema validation failed with the following errors: ${util.inspect(
            ajv.errors
          )}`
        );
      }
      global.logger.info(
        `QuestConfig loaded and validated from ${questConfigFilePath}.`
      );
      return questConfig;
    } catch (ex) {
      global.logger.info(
        `Unable to load the Quest Config. Server cannot start. Inner error: ${ex.message}`
      );
      process.exit(-1);
    }
  }
}

module.exports = QuestConfig;
