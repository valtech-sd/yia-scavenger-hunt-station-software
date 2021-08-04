// Constants
const SERVER_URI = 'http://localhost:8000';
const POLL_ENDPOINT = '/api/get-box-state';
const CLEAR_GUEST_ENDPOINT = '/api/clear-box-state';
const LIGHT_CONTROL_ENDPOINT = '/api/control-lights';
const ANALYTICS_ENDPOINT = '/api/report-event';
const POLLING_INTERVAL_MS = 750;
// WATCHDOG_INTERVAL is how long in between checking for a client in an inconsistent state
const WATCHDOG_INTERVAL = 2; // 2 seconds
// WATCHDOG_STATE_STUCK_LIMIT should be long enough for an entire view sequence to happen (including all state changes)
const WATCHDOG_STATE_STUCK_LIMIT = 30; // 30 seconds
const MEDIA_PATH = 'media'; // do not start nor end with '/' so that media is loaded with a relative path!
// Uncomment one of the two AUDIO_MODEs. Why is this here? During DEV audio can be annoying.
// See the Station Client Readme for limitations on AUTOPLAY for AUDIO on browsers!
const AUDIO_MODE = '';
// const AUDIO_MODE = 'muted';

// ENUM for VIEW_STATES
const VIEW_STATES = {
  Loading: 'Loading',
  SetupForIdle: 'SetupForIdle',
  Idle: 'Idle',
  BoxStateDidChange: 'BoxStateDidChange',
  GuestDidChange: 'GuestDidChange',
  Activating: 'Activating',
  Fail: 'Fail',
  FailRetry: 'FailRetry',
  Win: 'Win',
  Timeout: 'Timeout',
  Answering: 'Answering',
  MainShow: 'MainShow',
  ActivationSuccess: 'ActivationSuccess',
  UnsuccessfulActivation: 'UnsuccessfulActivation',
  NotActiveStation: 'NotActiveStation',
  ResetForNewGuest: 'ResetForNewGuest',
};

// Constant for video flags
const VIDEO_FLAGS = {
  loop: true,
  playonce: false,
};

// Setup our main View State object
let ViewData;
ViewData = {
  viewState: VIEW_STATES.Loading,
  answerTryCount: 0,
  boxState: null,
  lastInput: '',
  currentVideoPlaying: null,
  watchdog: { viewState: null, timestamp: null },
};

/**
 * Sets the client state, which saves state to the ViewData
 * and also performs actions to handle the change.
 *
 * @param state
 */
function setViewState(state) {
  // Ensure stat is indeed changing (by exiting if it's not)
  if (ViewData.viewState === state) return;

  // ASSERT: viewState is changing!
  console.log(
    'viewState is %s and is being set to change to %s',
    ViewData.viewState,
    state
  );

  // Log Analytics for the State Change
  if (ViewData && ViewData.boxState) {
    sendAnalytics(createAnalyticsDataObject(state, ViewData));
  }

  // Persist the viewState change
  ViewData.viewState = state;

  // Perform actions depending on the new state
  switch (state) {
    case VIEW_STATES.SetupForIdle:
      // Turn off lights
      setLights('Off');
      // Ensure backend is polling - so we get scans
      ensureBackendIsPolling();
      // Listen for keypress (safe to call repeatedly since it will first stop any prior listeners)
      listenForOneKeypress(() => {
        // On any keypress while in Idle, we go to UnsuccessfulActivation
        setViewState(VIEW_STATES.UnsuccessfulActivation);
      });
      // Load and Play the Idle Media
      playVideo('#idleMedia', VIDEO_FLAGS.playonce, () => {
        // Each time the video plays through
        // Clear a guest (in case it was missed or server-side is stuck)
        setViewState(VIEW_STATES.ResetForNewGuest);
      });
      setViewState(VIEW_STATES.Idle);
      break;
    case VIEW_STATES.Idle:
      // Just idling...
      break;
    case VIEW_STATES.GuestDidChange:
      // New guest, so setup the view to restart the experience
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      if (setAllMedia()) {
        // Media set so, going to Activating
        setViewState(VIEW_STATES.Activating);
      } else {
        // Set All Media did not complete, so we go to Idle
        setViewState(VIEW_STATES.Idle);
      }
      break;
    case VIEW_STATES.BoxStateDidChange:
      // BoxState changed but not New guest, so we can reset all the media that we can
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      setAllMedia();
      setViewState(VIEW_STATES.SetupForIdle);
      break;
    case VIEW_STATES.Activating:
      // New guest is setup, check to see if their interaction is valid.
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart

      // Stop Keypress since we don't need it right now
      cancelKeypress();

      // Check not-active station
      if (
        !ViewData.boxState['questItem']['activeFlag'] ||
        ViewData.boxState['questItem']['activeFlag'] === 'N' ||
        ViewData.boxState['questItem']['activeFlag'] === 'n'
      ) {
        // Station is not active, so let's fire that event
        setViewState(VIEW_STATES.NotActiveStation);
      } else if (
        ViewData.boxState['SEQUENCE_ID'] !==
        ViewData.boxState['guestSequenceId']
      ) {
        // Incorrect sequence: the BOX sequence does not match the Guest's token
        setViewState(VIEW_STATES.UnsuccessfulActivation);
      } else {
        // Activation is good so fire off that event
        setViewState(VIEW_STATES.ActivationSuccess);
      }
      break;
    case VIEW_STATES.NotActiveStation:
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      // A new guest is attempting to interact with a station that is not active
      playVideo('#notActiveMedia', VIDEO_FLAGS.playonce, () => {
        // When the video plays through
        // Clear any guest that might be sticking
        setViewState(VIEW_STATES.ResetForNewGuest);
      });
      break;
    case VIEW_STATES.UnsuccessfulActivation:
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      // A new guest is playing with the wrong week token OR pressed a button before
      playVideo('#unsuccessfulActivationMedia', VIDEO_FLAGS.playonce, () => {
        // When the video plays through,
        // Clear a guest (in the case of WRONG-STATION this will clear the Box State to allow a new scan)
        setViewState(VIEW_STATES.ResetForNewGuest);
      });
      break;
    case VIEW_STATES.ActivationSuccess:
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      // A new guest successfully activated a station
      // Set Answer Try Count to 0 (New question with no answer attempts)
      ViewData.answerTryCount = 0;
      playVideo('#activationMedia', VIDEO_FLAGS.playonce, () => {
        // When the video plays through, fire off a change in state to Idle
        setViewState(VIEW_STATES.MainShow);
      });
      break;
    case VIEW_STATES.MainShow:
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      // The view is showing the Main Show
      // Set lights for the given question type
      setLights(ViewData.boxState['questItem']['viewType']);
      // Listen for keypress
      listenForOneKeypress(() => {
        // On any keypress while in Idle, we go to UnsuccessfulActivation
        setViewState(VIEW_STATES.Answering);
      });
      playVideo('#mainMedia', VIDEO_FLAGS.playonce, () => {
        // When the video plays through (with no answer), fire off a change in state to TIMEOUT
        setViewState(VIEW_STATES.Timeout);
      });
      break;
    case VIEW_STATES.Answering:
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      // The guest has tried an answer, we need to check it and decide the outcome
      // Increment Answer Try Count since this is +1
      ViewData.answerTryCount++;
      if (
        ViewData.boxState['questItem']['successKeys'].includes(
          ViewData.lastInput
        )
      ) {
        // Correct Answer! Set to WIN
        setViewState(VIEW_STATES.Win);
      } else if (
        ViewData.answerTryCount <
        ViewData.boxState['questItem']['retriesAllowed']
      ) {
        // Incorrect answer, but guest has retries so fire that
        setViewState(VIEW_STATES.FailRetry);
      } else {
        // Retries exhausted, fire that
        setViewState(VIEW_STATES.Fail);
      }
      break;
    case VIEW_STATES.Timeout:
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      // The guest timed out from the Main Show!

      // Send a WIN event
      sendAnalytics(createInteractionDataObject(`Timeout`, ViewData));

      playVideo('#timeoutMedia', VIDEO_FLAGS.playonce, () => {
        // When the video plays through, fire off a change in state to Idle
        setViewState(VIEW_STATES.ResetForNewGuest);
      });
      break;
    case VIEW_STATES.Win:
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      // The guest "won" this view!

      // Send a WIN event
      sendAnalytics(createInteractionDataObject(`Win`, ViewData));

      // Figure out what we play based on view type
      if (ViewData.boxState['questItem']['viewType'] === 'OpenChoice') {
        // Play a video based on the user's keypress (which are already UPPERCASED when being received)
        // Yes I know a select here is way more verbose, but it's also more clear. :)
        let selectorToPlayForOpenChoice;
        switch (ViewData.lastInput) {
          case 'A':
            selectorToPlayForOpenChoice = '#successMediaA';
            break;
          case 'B':
            selectorToPlayForOpenChoice = '#successMediaB';
            break;
          case 'C':
            selectorToPlayForOpenChoice = '#successMediaC';
            break;
          case 'D':
            selectorToPlayForOpenChoice = '#successMediaD';
            break;
        }
        // Play the proper video!
        playVideo(selectorToPlayForOpenChoice, VIDEO_FLAGS.playonce, () => {
          // When the video plays through, fire off a change in state to Idle
          setViewState(VIEW_STATES.ResetForNewGuest);
        });
      } else {
        // Just play the success video
        playVideo('#successMedia', VIDEO_FLAGS.playonce, () => {
          // When the video plays through, fire off a change in state to Idle
          setViewState(VIEW_STATES.ResetForNewGuest);
        });
      }
      break;
    case VIEW_STATES.FailRetry:
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      // The guest failed a retry so we show that!
      playVideo('#retryMedia', VIDEO_FLAGS.playonce, () => {
        // When the video plays through, fire off a change in state to Idle
        setViewState(VIEW_STATES.MainShow);
      });
      break;
    case VIEW_STATES.Fail:
      // IMPORTANT: Polling is stopped - eventual going back to Idle will restart
      // The guest failed the Main Show including all retries!

      // Send a WIN event
      sendAnalytics(createInteractionDataObject(`Fail`, ViewData));

      playVideo('#failMedia', VIDEO_FLAGS.playonce, () => {
        // When the video plays through, fire off a change in state to Idle
        setViewState(VIEW_STATES.ResetForNewGuest);
      });
      break;
    case VIEW_STATES.ResetForNewGuest:
      // Reset the server API for a new guest
      console.log('ResetForNewGuest firing...');
      resetForNewGuest().then(() => {
        // Set to Idle
        setViewState(VIEW_STATES.Idle);
      });
      break;
    default:
      console.log('setViewState called with invalid state = ' + state);
  }
  // Nothing else should happen here after the SWITCH!!
}

/**
 * A quickie method to play video (that respects our AUDIO_MODE flag)
 * @param selector - the selector for the <video> element
 * @param loopFlag - true/false to loop the video or not. Defaults to false.
 * @param playthroughClosure - a closure that will be resolved once the video plays through. Ignored with loopFlag==true.
 */
function playVideo(selector, loopFlag = VIDEO_FLAGS.loop, playthroughClosure) {
  console.log(
    `Request received to playVideo for selector="${selector}" with loop="${loopFlag}" and playthrough-closure-present="${
      playthroughClosure !== null
    }"`
  );

  // If we're playing a different video "next", we want to hide/pause any others
  if (
    !ViewData.currentVideoPlaying ||
    ViewData.currentVideoPlaying !== selector
  ) {
    // Stop + hide all videos before playing another
    $('video').hide().trigger('pause');
  }

  // Enforce Audio Mode per our page flag
  $(selector).prop('muted', AUDIO_MODE === 'muted');
  // Enable/disable looping per our page flag
  $(selector).prop('loop', loopFlag);
  // Check to see if we received a closure, and loopFlag==false
  if (!loopFlag && playthroughClosure) {
    // We received a closure, and loopFlag==false, let's wire in the event, but note we use
    // jQuery's "one" method to ONLY fire the event once. Therefore the closure must
    // change viewState properly to remove the video, play another, etc.
    $(selector).one('ended', () => {
      console.log(
        `Video with selector "${selector}" ended. Firing off the playthroughClosure()`
      );
      playthroughClosure();
    });
  }
  // If we're playing a different video "next", we need to fade it in before we play it
  if (
    !ViewData.currentVideoPlaying ||
    ViewData.currentVideoPlaying !== selector
  ) {
    $(selector).fadeIn();
  }
  // Play the video
  $(selector).prop('currentTime', 0).trigger('play');
  // Set the global page var of what is playing
  ViewData.currentVideoPlaying = selector;
  // Log
  console.log(`Playing ${selector}`);
}

/**
 * Checks the boxState and sets all the videos to the matching media
 */
function setAllMedia() {
  try {
    // Nothing to do if we don't yet have boxState
    if (!ViewData.boxState) {
      return;
    }

    // ASSERT: We have boxState so lets set all the media that we can.

    // A shortcut for boxState to type less
    const bxst = ViewData.boxState;
    // Pull out Idle Media
    const idleMedia = bxst.supportingMedia['idleMedia'];
    const unsuccessfulActivationMedia =
      bxst.supportingMedia['unsuccessfulMedia'];

    // Now set idle and unsuccessful activation
    setSingleMedia('#idleMedia', idleMedia);
    setSingleMedia('#unsuccessfulActivationMedia', unsuccessfulActivationMedia);

    // Process Quest Item Media
    const questItem = bxst.questItem;
    if (questItem) {
      setSingleMedia('#notActiveMedia', questItem['notActiveMedia']);
      setSingleMedia('#activationMedia', questItem['activationMedia']);
      setSingleMedia('#mainMedia', questItem['mainMedia']);
      setSingleMedia('#timeoutMedia', questItem['timeoutMedia']);
      setSingleMedia('#successMedia', questItem['successMedia']);
      setSingleMedia('#retryMedia', questItem['retryMedia']);
      setSingleMedia('#failMedia', questItem['failMedia']);
      setSingleMedia('#successMediaA', questItem['successMediaA']);
      setSingleMedia('#successMediaB', questItem['successMediaB']);
      setSingleMedia('#successMediaC', questItem['successMediaC']);
      setSingleMedia('#successMediaD', questItem['successMediaD']);
    } else {
      throw new Error('questItem is empty! Cant set Quest Media!');
    }
    return true;
  } catch (ex) {
    console.log('setAllMedia warning: "%s"', ex.message);
    return false;
  }
}

function setSingleMedia(selector, mediaSrc) {
  // Only do this for non-empty-or-null mediaSrc
  if (mediaSrc) {
    // Setup the path for the <source> element inside the given <video>
    const sourceSelector = selector + ' source';
    // The full media path (we only receive the file name from the API)
    const fullMediaPath = MEDIA_PATH + '/' + mediaSrc;
    // Log
    console.log(
      'Setting video source for selector "%s" to "%s"',
      sourceSelector,
      fullMediaPath
    );
    // Set the SRC attribute of the <source> element inside the given <video>,
    // but only if different than it's set to  (This prevents the "blink" we get when loading)
    if ($(sourceSelector).attr('src') !== fullMediaPath) {
      $(sourceSelector).attr('src', fullMediaPath);
      // Force a load of the <video> element so the new content is loaded
      $(selector).trigger('load');
    }
  }
}

/**
 * Polling Helpers
 */

let pollingHandle;

/**
 * Ensures polling of the backend is happening.
 * This can be called multiple times but will only start a single polling process.
 */
function ensureBackendIsPolling() {
  // If pollingHandle is set, we're already polling so we bail here
  if (pollingHandle) return;
  // Otherwise, let's start polling and hold on to a handle so we can stop if needed
  console.log('Polling starting.');
  // Use an interval to keep polling until stopped. We save the interval handle so we can stop later when needed
  pollingHandle = setInterval(function () {
    // Fire off a GET from the Station Server API
    $.get(SERVER_URI + POLL_ENDPOINT, function (serverResponse) {
      // Server Call Successful - let's validate the serverResponse
      // TODO: Add a JSON SCHEMA check for boxState (serverResponse)
      console.log('Polling ok. Checking for changes...');
      if (!_.isEqual(ViewData.boxState, serverResponse)) {
        // Change detected, so stop further polling until we handle it
        stopBackendPolling();
        // Now handle it
        console.log('boxState changed. Inspecting...');
        if (!ViewData.boxState) {
          // We don't yet have boxState so  save it
          console.log('Setting boxState for the first time.');
          ViewData.boxState = serverResponse;
          // Now, do we have a guestTokenId yet? (this determines which state we fire)
          if (!serverResponse.guestTokenId) {
            // No guest, so just fire BoxStateDidChange
            // Fire off the new state - which will restart polling once it finishes
            console.log('No guestTokenId yet.');
            setViewState(VIEW_STATES.BoxStateDidChange);
          } else {
            // We do have a guest, so instead fire GuestDidChange
            console.log('New guestTokenId.');
            setViewState(VIEW_STATES.GuestDidChange);
          }
        } else if (
          serverResponse.guestTokenId &&
          ViewData.boxState.guestTokenId !== serverResponse.guestTokenId
        ) {
          // The boxState is different, serverResponse.guestTokenId is not null, so we checked for a new guest.
          // If the guestTokenId is changing, save to ViewData & fire that state
          ViewData.boxState = serverResponse;
          console.log('New guestTokenId: %s', serverResponse.guestTokenId);
          // Fire off the new state - which will restart polling once it finishes
          setViewState(VIEW_STATES.GuestDidChange);
        } else {
          // The boxState is different, since guestTokenId did not change, save to
          // ViewData & fire the generic BoxStateDidChange
          ViewData.boxState = serverResponse;
          console.log('guestTokenId not present or unchanged.');
          // Fire off the new state - which will restart polling once it finishes
          setViewState(VIEW_STATES.BoxStateDidChange);
        }
      }
    }).fail(function (jqXHR, textStatus, errorThrown) {
      // Uh Oh... Server Call failed. No bueno! Log it.
      console.log('Polling error!');
    });
  }, POLLING_INTERVAL_MS);
}

/**
 * Stops backend polling.
 */
function stopBackendPolling() {
  // If we don't have a polling handle, there's nothing to stop
  if (!pollingHandle) return;
  // Else, stop the polling
  console.log('Polling stopping.');
  clearInterval(pollingHandle);
  // Clear the prior handle also, otherwise it will point to the old (stopped) interval
  pollingHandle = null;
}

/**
 * A method to make a rest call to set the lights properly
 * @param lightSequence
 */
function setLights(lightSequence) {
  const queryString = '?lightSequence=' + lightSequence;
  $.get(SERVER_URI + LIGHT_CONTROL_ENDPOINT + queryString, (serverResponse) => {
    console.log('setLights->%s OK.', lightSequence);
  }).fail(function (jqXHR, textStatus, errorThrown) {
    // Uh Oh... Server Call failed. No bueno! Log it.
    console.log('setLights error!');
  });
}

/**
 * A method to clear the guest from the server side API
 */
function resetForNewGuest() {
  // Stop polling so we can reset without conflicts
  stopBackendPolling();
  // Reset the API BoxState (which clears the guest)
  // Note this is a PROMISE!! So the caller must wait for that!!
  return $.get(SERVER_URI + CLEAR_GUEST_ENDPOINT, (serverResponse) => {
    // All good. Log it.
    console.log('resetForNewGuest OK.');
  })
    .fail((jqXHR, textStatus, errorThrown) => {
      // Uh Oh... Server Call failed. No bueno! Log it.
      console.log('resetForNewGuest error!');
    })
    .always(() => {
      // When all done, Good or bad, we restart polling!
      ensureBackendIsPolling();
    });
}

/**
 * Create an analytics object as required by the /api/report-event endpoint.
 *
 * @param state
 * @param ViewData
 * @returns analyticsDataObject suitable for /api/report-event
 */
function createAnalyticsDataObject(state, ViewData) {
  return {
    guestTokenId: ViewData.boxState.guestTokenId,
    eventName: `StationClient | State changing to: ${state}`,
    BOX_ID: ViewData.boxState.BOX_ID,
    SEQUENCE_ID: ViewData.boxState.guestSequenceId,
    variantId: ViewData.boxState.guestVariantId,
    otherData: {
      newState: state,
      viewDataBeforeStateChange: ViewData,
    },
  };
}

/**
 * Create an interaction object as required by the /api/report-event endpoint.
 *
 * @param interactionResult
 * @param ViewData
 * @returns analyticsDataObject suitable for /api/report-event
 */
function createInteractionDataObject(interactionResult, ViewData) {
  return {
    guestTokenId: ViewData.boxState.guestTokenId,
    eventName: `StationClient | Guest Interaction Result`,
    BOX_ID: ViewData.boxState.BOX_ID,
    SEQUENCE_ID: ViewData.boxState.guestSequenceId,
    variantId: ViewData.boxState.guestVariantId,
    otherData: {
      interactionResult: interactionResult,
      viewType: ViewData.boxState.questItem.viewType,
      guestSelection: ViewData.lastInput,
    },
  };
}

/**
 * Send the analytics to the Station Server!
 *
 * @param analyticsDataObject
 */
function sendAnalytics(analyticsDataObject) {
  // POST to the API Server Analytics Endpoint
  $.ajax(SERVER_URI + ANALYTICS_ENDPOINT, {
    method: 'POST',
    contentType: 'application/json',
    // Stringify since we'll do our own processing
    data: JSON.stringify(analyticsDataObject),
    processData: false,
  }).fail((jqXHR, textStatus, errorThrown) => {
    console.log('sendAnalytics error');
  });
}

/**
 * Listening for a single keypress
 * @param onKeypressClosure
 */
function listenForOneKeypress(onKeypressClosure) {
  // If we didn't get a closure, we won't do a thing!
  if (!onKeypressClosure) {
    console.log(
      'listenForOneKeypress called with empty onKeypressClosure. Ignoring. No Keypress will be detected.'
    );
    return;
  }

  console.log('keypress listening...');

  // Listen for keypress on the entire page, and fire the Keypress closure
  // Note we turn off any prior keypress and only setup for the first one observed.
  // Why? We restart this as needed when we expect input.
  $('body')
    .off('keypress')
    .one('keypress', (event) => {
      console.log(
        'keypress: %s. Saving to lastInput and firing off the closure passed by the last caller.',
        event.key
      );
      event.preventDefault();
      // Set it to the ViewData (always in uppercase)
      ViewData.lastInput = event.key.toUpperCase();
      // Fire off the closure to handle it
      onKeypressClosure();
    });
}

/**
 * Cancel the keypress event
 */
function cancelKeypress() {
  console.log('keypress stopping...');
  $('body').off('keypress');
}

/**
 * A simple mechanism to prevent a stuck client.
 * This calls various individual checks on an interval.
 */
function clientWatchdog() {
  // Set our interval check every so often
  setInterval(() => {
    // Check for playing video
    ensureVideoIsPlaying();
    // Check for stuck state
    ensureStateIsNotStuck();
  }, WATCHDOG_INTERVAL * 1000);
}

/**
 * A very simple check to see if at least one video is playing
 * and if not, calls the right view state setup!
 */
function ensureVideoIsPlaying() {
  // We expect a video to be playing Idle. If not, we have a problem!
  if ($('video').prop('paused') && ViewData.viewState === VIEW_STATES.Idle) {
    // Somehow we're paused, and there should always be video playing on Idle
    // So we reset!
    console.log(
      `Detected that no video is playing while Idle! Setting SetupForIdle.`
    );
    setViewState(VIEW_STATES.SetupForIdle);
  }
}

/**
 * Ensures that viewState is not stuck in a state (other than Idle states) for longer
 * than WATCHDOG_STATE_STUCK_LIMIT which is set at page level.
 *
 * If this is detected, the method forces a setViewState to SetupForIdle.
 *
 */
function ensureStateIsNotStuck() {
  // Convenience
  const wo = ViewData.watchdog;
  // First time?
  if (!wo.viewState || wo.viewState !== ViewData.viewState) {
    // first time setup or different since last check, so just capture
    wo.viewState = ViewData.viewState;
    // Timestamp in seconds
    wo.timestamp = Math.floor(new Date().getTime() / 1000.0);
  } else {
    // Same state since last check.
    // Set the timestamp of the check we're doing "now" in seconds
    const nowCheck = Math.floor(new Date().getTime() / 1000.0);
    // Are we stuck in the same state, other than Idle states, for more than some time?
    if (
      ViewData.viewState !== VIEW_STATES.Idle &&
      ViewData.viewState !== VIEW_STATES.SetupForIdle &&
      nowCheck - wo.timestamp > WATCHDOG_STATE_STUCK_LIMIT
    ) {
      // We are stuck... log & take corrective action
      console.log(
        `Stuck in ${ViewData.viewState} for over ${WATCHDOG_STATE_STUCK_LIMIT} seconds. Setting SetupForIdle.`
      );
      setViewState(VIEW_STATES.SetupForIdle);
    }
  }
}

// On DOM Ready, fire off all the things
$(() => {
  // Start with Backend polling, which will set the right view state
  ensureBackendIsPolling();
  // Start our watchdog
  clientWatchdog();
});
