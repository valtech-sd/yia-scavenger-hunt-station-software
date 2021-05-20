'use strict';

// Local dependencies
const BoxState = require('../models/BoxState');

// Local instances of globals
const config = global.config;

// Pull from config
const INTERNAL_BOX_ID = config.get('BOX_ID');
const INTERNAL_SEQUENCE_ID = config.get('SEQUENCE_ID');

class QuestApiController {
  /**
   * Implementation for path '/api/setBoxState' method GET.
   * For the expected BODY, QUERY or PATH, see the Swagger definition that controls this API.
   *
   * @param req - the Express request object (enhanced with req.swagger) by swagger-express-middleware
   * @param res - the Express response object
   * @param next - the Express next handler method which we can pass errors into if needed
   */
  static setBoxState(req, res, next) {
    // Set a good status
    res.status(200);
    // Set our content type out
    res.type('application/json');

    // Set the global state (this will also hydrate a more detailed config for this box, variant and sequence)
    BoxState.setBoxState(
      // Override BOX_ID if passed in the Query String, otherwise used the internal BOX_ID from the config
      req.query.BOX_ID || INTERNAL_BOX_ID,
      req.query.SEQUENCE_ID || INTERNAL_SEQUENCE_ID,
      req.query.guestSequenceId,
      req.query.guestVariantId,
      req.query.guestTokenId
    );

    // Respond
    res.send(JSON.stringify(BoxState.getState()));
  }

  /**
   * Implementation for path 'clearBoxState' method GET.
   * For the expected BODY, QUERY or PATH, see the Swagger definition that controls this API.
   *
   * @param req - the Express request object (enhanced with req.swagger) by swagger-express-middleware
   * @param res - the Express response object
   * @param next - the Express next handler method which we can pass errors into if needed
   */
  static clearBoxState(req, res, next) {
    // Set a good status
    res.status(200);
    // Set our content type out
    res.type('application/json');

    // Set the global state (BOX_ID will default back to what is in the config for the box)
    BoxState.clearState();

    // Respond
    res.send(JSON.stringify(BoxState.getState()));
  }

  /**
   * Implementation for path 'getBoxState' method GET.
   * For the expected BODY, QUERY or PATH, see the Swagger definition that controls this API.
   *
   * @param req - the Express request object (enhanced with req.swagger) by swagger-express-middleware
   * @param res - the Express response object
   * @param next - the Express next handler method which we can pass errors into if needed
   */
  static getBoxState(req, res, next) {
    // Set a good status
    res.status(200);
    // Set our content type out
    res.type('application/json');

    // Prepare a response object
    const stateResponse = {
      viewState: BoxState.getState(),
    };

    // Respond
    res.send(JSON.stringify(BoxState.getState()));
  }
}

module.exports = QuestApiController;
