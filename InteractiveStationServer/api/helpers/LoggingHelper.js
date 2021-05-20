'use strict';

// Package Dependencies
const bunyan = require('bunyan');

// Project Dependencies
const packageDetails = require('../../package.json');

/**
 * This is a wrapper around Bunyan (for now).
 * Why? We might want to change how logging actually analytics
 * or where it analytics to and this lets us do it in a single location.
 */

// Create a logger
const logger = bunyan.createLogger({ name: packageDetails.name });

// Expose our own custom logger (for now, these are just calls to bunyan's logger)
global.logger = {
  info: (...args) => {
    logger.info(...args);
  },
  warn: (...args) => {
    logger.warn(...args);
  },
  error: (...args) => {
    logger.error(...args);
  },
  debug: (...args) => {
    logger.debug(...args);
  },
  fatal: (...args) => {
    logger.fatal(...args);
  },
  trace: (...args) => {
    logger.trace(...args);
  },
};
