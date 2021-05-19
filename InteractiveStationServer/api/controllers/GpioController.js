'use strict';

class GpioController {
  static controlLights(req, res, next) {
    // Set a good status
    res.status(200);
    // Set our content type out
    res.type('application/json');

    const lightSequence = req.query.lightSequence;

    // TODO: Implement light effects based on the incoming lightSequence

    // Prepare a response object
    const response = {
      controlLightsResponse: 'ok',
    };

    // Respond
    res.send(JSON.stringify(response));
  }
}

module.exports = GpioController;
