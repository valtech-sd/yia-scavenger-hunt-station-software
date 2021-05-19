'use strict';

/**
 * The controller for the path '/'.
 */
class IndexController {
  /**
   * Implementation for path '/' method GET.
   * @param req - the Express request object (enhanced with req.swagger) by swagger-express-middleware
   * @param res - the Express response object
   * @param next - the Express next handler method which we can pass errors into if needed
   */
  static indexGet(req, res, next) {
    // Set a good status
    res.status(200);
    // Set our content type out
    res.type('application/json');

    // Note, to THROW an HTTP ERROR that Express will handle simply create a new HttpError and return it via the
    // `next()` callback.
    // For example:
    // const newHttpError = new HttpError(400);
    // newHttpError.message = 'some friendly error message here';
    // return next(newHttpError);

    // Prepare a response object
    const pingResponse = {
      ping: 'OK',
      timestamp: Math.floor(new Date().getTime() / 1000.0),
    };
    // Respond
    res.send(JSON.stringify(pingResponse));
  }
}

module.exports = IndexController;
