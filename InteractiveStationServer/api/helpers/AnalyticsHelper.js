'use strict';

// Package Dependencies
const bunyan = require('bunyan');
const appRoot = require('app-root-path');
const path = require('path');

// Project Dependencies
const packageDetails = require('../../package.json');

// Local instances of globals
const config = global.config;

/**
 * This is a wrapper around Bunyan (for now).
 * Why? We might want to change how logging actually analytics
 * or where it analytics to and this lets us do it in a single location.
 */

// Where to log
const analyticsLogPath = path.join(
  appRoot.path,
  config.get('analyticsLogPath')
);
const analyticsLogFileName = config.get('analyticsFileName');

// TODO: Bunyan's file rotation is not awesome. It renames old files to a number for "days ago". We might be better off just writing a single log and using FILEROTATE built into linux.

// Create a logger
const logger = bunyan.createLogger({
  name: packageDetails.name,
  streams: [
    {
      type: 'rotating-file',
      path: `${analyticsLogPath}/${analyticsLogFileName}`,
      period: '14d', // daily rotation
      count: 4, // keep 3 back copies
    },
    {
      stream: process.stdout, // log INFO and above to stdout
    },
  ],
});

// Expose our own custom logger (for now, these are just calls to bunyan's logger)
global.analyticsLogger = {
  event: (...args) => {
    logger.info(...args);
  },
};
