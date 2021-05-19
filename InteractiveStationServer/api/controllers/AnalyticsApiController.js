'use strict';

class AnalyticsApiController {
  /**
   * A method to receive an analytics event and write it out to the Analytics Log.
   *
   * @param req - the Express request object (enhanced with req.swagger) by swagger-express-middleware
   * @param res - the Express response object
   * @param next - the Express next handler method which we can pass errors into if needed
   */
  static reportEventPost(req, res, next) {
    // Set a good status
    res.status(204);
    // Set our content type out
    res.type('application/json');

    // ASSERT: req.body has everything we want to log

    // Log to analytics
    global.analyticsLogger.event(req.body, 'Analytics Event');

    // Respond with no content since none is needed
    res.send();
  }
}

module.exports = AnalyticsApiController;
