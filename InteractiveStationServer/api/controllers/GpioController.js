'use strict';

// Package dependencies
const MockGpio = require('../helpers/MockGpio');

// We might be running on hardware that does not support GPIO
// Darwin/win32 Mod (will mock GPIO instead of actually using it)
const UseMockGpio =
  process.platform === 'darwin' || process.platform === 'win32';
// An object that will hold our GPIO
const GPIO = UseMockGpio ? MockGpio : require('onoff').Gpio;

// Constants for the lights
const a_light = new GPIO(6, 'out');
const b_light = new GPIO(13, 'out');
const c_light = new GPIO(19, 'out');
const d_light = new GPIO(26, 'out');

// Light sequence ENUM (NOTE: MATCH THESE TO THE INCOMING REST API)
const LIGHT_SEQUENCE = {
  MultiChoice: 'MultiChoice',
  TrueFalse: 'TrueFalse',
  IncrDecr: 'IncrDecr',
};

// Register an application Exit Task to unexport the pins.
global.exitTasks.push(() => {
  a_light.unexport();
  b_light.unexport();
  c_light.unexport();
  d_light.unexport();
});

class GpioController {
  static controlLights(req, res, next) {
    // Set a good status
    res.status(200);
    // Set our content type out
    res.type('application/json');

    a_light.setActiveLow(true);
    b_light.setActiveLow(true);
    c_light.setActiveLow(true);
    d_light.setActiveLow(true);

    const lightSequence = req.query['lightSequence'];

    // Implement light effects based on the incoming lightSequence
    switch (lightSequence) {
      case LIGHT_SEQUENCE.MultiChoice:
        // User for single answer multiple choice questions. Active until answer is chosen or timeout.
        global.logger.info('controlLights configuring for "Multiple Choice Question"');
        a_light.writeSync(1);
        b_light.writeSync(1);
        c_light.writeSync(1);
        d_light.writeSync(1);
        break;
      case LIGHT_SEQUENCE.TrueFalse:
        // Used for true / false questions. Active until an answer is chosen or timeout.
        global.logger.info('controlLights configuring for "True/False Question"');
        a_light.writeSync(0);
        b_light.writeSync(1);
        c_light.writeSync(1);
        d_light.writeSync(0);
        break;
      case LIGHT_SEQUENCE.IncrDecr:
        // Used for  increasing / decreasing an integer game. Active until timeout.
        global.logger.info('controlLights configuring for "Increment/Decrement Question"');
        a_light.writeSync(1);
        b_light.writeSync(0);
        c_light.writeSync(0);
        d_light.writeSync(1);
        break;
      default:
        a_light.writeSync(0);
        b_light.writeSync(0);
        c_light.writeSync(0);
        d_light.writeSync(0);
    }

    // Prepare a response object
    const response = {
      controlLightsResponse: 'ok',
    };

    // Respond
    res.send(JSON.stringify(response));
  }
}

module.exports = GpioController;
