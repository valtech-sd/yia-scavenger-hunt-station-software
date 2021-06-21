'use strict';

/**
 * This is a MOCK class so that we can make calls to GPIO methods on a
 * device that does not really have GPIO (like a developer's workstation.)
 * This is intended to be used for testing only.
 *
 * Methods below just log to the console!
 *
 * Each needed GPIO method needs to be implemented below.
 *
 */
class MockGpio {
  #MockGpioPropertiesFromConstructor = [];

  constructor(...args) {
    this.#MockGpioPropertiesFromConstructor = args;
  }

  setActiveLow(value) {
    global.logger.info(
      `MockGpio->setActiveLow(): ${value} for (${
        this.#MockGpioPropertiesFromConstructor
      }).`
    );
  }

  writeSync(value) {
    global.logger.info(
      `MockGpio->writeSync(): ${value} for (${
        this.#MockGpioPropertiesFromConstructor
      }).`
    );
  }
  unexport() {
    global.logger.info(
      `MockGpio->unexport() for (${this.#MockGpioPropertiesFromConstructor}).`
    );
  }
}

module.exports = MockGpio;
