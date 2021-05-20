'use strict';

const GPIO = require("onoff").Gpio;

const a_light = new GPIO(6, 'out');
const b_light = new GPIO(13, 'out');
const c_light = new GPIO(19, 'out');
const d_light = new GPIO(26, 'out');

class GpioController {
  static controlLights(req, res, next) {
    // Set a good status
    res.status(200);
    // Set our content type out
    res.type('application/json');

    const lightSequence = req.query.lightSequence;

    // TODO: Implement light effects based on the incoming lightSequence
    switch(lightSequence) {
      case "1":
        // User for single answer multiple choice questions. Active until answer is chosen or timeout.
        console.log('Multiple Choice Question');
        a_light.writeSync(0);
        b_light.writeSync(0);
        c_light.writeSync(0);
        d_light.writeSync(0);
        break;
      case "2":
        // Used for true / false questions. Active until an answer is chosen or timeout.
        console.log('True/False Question');
        a_light.writeSync(1);
        b_light.writeSync(0);
        c_light.writeSync(0);
        d_light.writeSync(1);
        break;
      case "3":
        // Used for  increasing / decreasing an integer game. Active until timeout.
        console.log('Increment/Decrement Question');
        a_light.writeSync(0);
        b_light.writeSync(1);
        c_light.writeSync(1);
        d_light.writeSync(0);
        break;
      case "0":
      default: 
        a_light.writeSync(1);
        b_light.writeSync(1);
        c_light.writeSync(1);
        d_light.writeSync(1);
    };

    // Prepare a response object
    const response = {
      controlLightsResponse: 'ok',
    };


    process.on('SIGINT', _ => {
      a_light.unexport();
      b_light.unexport();
      c_light.unexport();
      d_light.unexport();
    });

    // Respond
    res.send(JSON.stringify(response));
  }
}

module.exports = GpioController;
