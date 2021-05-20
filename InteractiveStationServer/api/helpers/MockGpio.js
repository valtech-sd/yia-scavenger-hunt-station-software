'use strict';

class MockGpio {
  #MockGpioPropertiesFromConstructor = [];

  constructor(...args) {
    this.#MockGpioPropertiesFromConstructor = args;
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
