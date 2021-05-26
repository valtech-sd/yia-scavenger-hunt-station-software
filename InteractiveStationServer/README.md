# InteractiveBoxServer - README

## Summary 

This is the Backend Server for the Interactive Boxes (stations).

To review the API definition, you can do either of:

* bring up the API DOCS by running this in NodeJS and reviewing http://localhost:8000/api-docs-ui/. 
* review the file **./api/swagger.yaml** for the API Specification.

## Credits

This API is based on API Focus. See the embedded README-ApiFocus or visit https://github.com/valtech-sd/ApiFocus for the latest.

## Dependencies

- NodeJS v14.16. 
- (Optional but recommended) Node Version Manager (nvm). For more information about Node Version Manager, see https://github.com/nvm-sh/nvm.
  - Ensure you have the proper version of node via nvm with `nvm install 14.16`
  
## Running the server

From inside the InteractiveBoxServer directory, do an `npm i` first to install dependencies, then:

```bash
npm run start-dev
```
(See package.json for other scripts.)

## Configuration (server & box config)

There are two files that hold configuration:

* ./config/config.js - holds all the valid configuration properties + defaults when not passed.
* ./config/\[env\].json5 - holds the specific configuration for a given \[env\] (NODE_ENV). For instance, the NODE_ENV=dev configuration would be held in dev.json5. 

### Overrides

* BOX_ID can be overridden in a NODE_ENV specific configuration file or by passing the BOX_ID environment variable into the NODE command. The server will not start without this value.
* SEQUENCE_ID can be overridden in a NODE_ENV specific configuration file or by passing the SEQUENCE_ID environment variable into the NODE command. The server will not start without this value.

In fact, for the Stations used, we're declaring BOX_ID in each station's ~/.bashrc where we're adding the following:

```bash
export BOX_ID=99
```
Where "99" is being set per Station!

## Quest Configuration

The quest details are held in quest-config.json5. Note this can be set to a different file via the server config, and it could be different for different values of NODE_ENV.

## Sequence of client actions

Assumptions:

* BOX_ID is burned into each box's config and is known to the server at all times.
* SEQUENCE_ID is also burned into each box's config and is known to the server at all times.
* Guests activate the boxes with a TOKEN that contains guestSequenceId and guestVariantId. The intention is that different sequences (different game play days) will use different tokens! A single token plays a single game play day.
* At some point, a guest's RFID scan will bring in both guestSequenceId and guestVariantId encoded on their token (these represent the sequence + variant the guest token enables the guest to interact with.)

Server States (not the same as client states which are more numerous):

- A guest has not yet scanned: in this case, a call to /api/get-box-state will return **BOX_ID**, **SEQUENCE_ID** and **supportingMedia**. This is sufficient to show a "please scan" type view on a client.
- After a guest scans (providing the box both guestVariantId & guestSequenceId): in this case, a call to /api/get-box-state will return **BOX_ID**, **variantId**, **SEQUENCE_ID**, **guestVariantId**, **guestSequenceId**, **supportingMedia** and **questItem**. This is sufficient to show full view, collect input, determine win/lose, etc.
  Note that a guest's guestSequenceId might be different than the box's SEQUENCE_ID. In this case (considered a failed activation), the client view should direct the guest to activate/scan with the proper token.

Clients should make the following sequence of calls & actions: (more detailed client behaviors are covered in the [Station Experience Flow](https://miro.com/app/board/o9J_lQB1txU=/?moveToWidget=3074457358885665688&cot=14))

- Polling /api/get-box-state should be performed repeatedly (every 500ms or longer) to detect a scan / change in state. A scan will be apparent once the **guestVariantId**, **guestSequenceId** are part of the box state.
  - In Box Idle, a push button should trigger the Unsuccessful Activation view + the client should call analytics for failed activation (push button in idle)
- Once a scan is detected, the client receives all the details and should:
  - Continue polling in case the tokenId changes.
    - If tokenId changes from what was previously received, the client should report to analytics that a view is aborting and then reset the view for the new tokenId, SEQUENCE_ID, variantId
  - Ensure the guest's sequence ID matches the sequence burned into the box. If not, a client view should display providing the user guidance on how to activate properly.
    - The client view should make an analytics call to report either the successful or failed activation (sequence mismatch).
  - If the guest sequence ID matches, the client should then display the view for the box, sequence and variant and take care of the entire interaction.
    - The client should make analytics calls to: timeout, failed answer w retry, full fail, win.
  - Clients should use the /api/flashlights endpoint to activate different light effects.
- After the view interaction ends, the client goes back to polling.

## State Management Api calls

Several API calls are available for State Management. These are primarily for testing purposes. 

The server's /api/set-box-state endpoint is generally called to set the guestVariantId and guestSequenceId (from a token scan). However, for testing purposes, this call can also be passed values to override BOX_ID and SEQUENCE_ID. See the API definition file for details. 

Typical call (uses box burnt in BOX_ID and SEQUENCE_ID): 
http://localhost:8000/api/set-box-state?guestVariantId=b&guestSequenceId=99

Testing call to override BOX_ID and SEQUENCE_ID:
http://localhost:8000/api/set-box-state?guestVariantId=b&guestSequenceId=99&BOX_ID=01&SEQUENCE_ID=01

After an override of BOX_ID and SEQUENCE_ID, you can call /api/clear-box-state to revert to the burnt in BOX_ID and SEQUENCE_ID.

## Analytics Endpoint

Clients should report events by calling the /api/report-event endpoint with:

- guestTokenId
- eventName (see list below)
- BOX_ID
- SEQUENCE_ID
- variantId
- otherData - optional but if passed, can be a JSON object with further arbitrary data of the client's choice.

The server will add:

- time (added server-side)
- name of the app
- hostname
- pid - process id

Analytics Event Names (and who generates them):
- (client) failed activation sequence mismatch
- (client) failed activation push button on idle
- (client) successful activation
- (client) view aborted for new token scan
- (client) view timeout
- (client) failed answer w retries left
- (client) failed answer no retries left
- (client) win
- (server) repeat scan on active sequence w new tokenId
- (server) repeat scan on active sequence w same tokenId

> **Note:** Do not include "(client)" nor "(server)" in the analytics name passed to the report-event endpoint.

### Analytics Config

The server's config has two keys that control where Analytics Events are stored:
- analyticsFileName - the name to be used for the Analytics Event Log. 
- analyticsLogPath - the path where the Analytics Event Log will be written to.

## Creating quest-config JSON from Google Sheets

Google Sheet (a single sheet) has two tabs for export:
* Support Media - https://docs.google.com/spreadsheets/d/15Br4KLswxdlrO5Tc39O9s5mMXmEOmMN9eza7VUZA8zI/edit#gid=1044919816
* Quest Item - https://docs.google.com/spreadsheets/d/15Br4KLswxdlrO5Tc39O9s5mMXmEOmMN9eza7VUZA8zI/edit#gid=353684181

Steps:
- Export each sheet to a CSV
- Eliminate any unwanted rows, etc.
- Bring into https://csvjson.com/csv2json and convert to JSON
- Copy the JSON to your favorite editor and perform the following REGEX REPLACE to tweak certain fields:
  - Replace 'SEQUENCE_ID: (\d\d?)' with 'SEQUENCE_ID: "$1"'
  - Replace 'BOX_ID: (\d\d?)' with 'BOX_ID: "$1"'
- Bring into the Quest Config for the project

## TODO

* (Stash) Implement rfid scan event with set of state - the GPIO event should use the static method BoxState.recordGuestScan(); See the TODO in the file EventsReceiver.js.
  - (MEDIUM PRIORITY) This possibly broke the server from running on Darwin. Requires research, so we can Mock or otherwise not enable this in Darwin. 
* (Stash) More light sequences? 
* (??) Admin tool to read and encode sequence+variant into tokens  
* (??) Refactor any uses of console.log()
* (Eric) Front end views matching [Sequence of client actions](#Sequence-of-client-actions).
* (Eric, low priority) Define the API endpoint responses more fully in the Swagger definition.
* (??, low priority) Refactor "box" for "station" in all the various places (i.e. STATION_ID, InteractiveStationServer, etc.)
* Server shows multiple "WARNING! Unable to find a Swagger operation that matches OPTIONS /api/get-box-state" on this and other endpoints. 
  - Is jQuery firing off OPTIONS? How can we disable it from doing that? (Otherwise we're going to pollute the logs big time!)

## More items to consider

Station Admin
- Admin Card brings up an admin view that can burn file with SequenceId & BOX_ID.

Station Deployment
- Deployment shoots the entire quest object to all boxes.
- Needs to set the prod.json5 for each box to have the proper BOX_ID and SEQUENCE_ID (we can re-run weekly to reset SEQUENCE_ID).

Station Logs Pull
- Need an Ansible to pull the logs from all stations. Should prob use a naming convention.

