# Interactive Station HTML Client

## Summary

// TODO: Write the readme.

## Audio Auto Play

Most browsers will not Auto-Play any video that has audio unless it's been explicitly permitted or the site.

The following are steps to use for various browsers:

- SAFARI preferences, websites, allow the specific website.
- CHROME preferences, privacy and security, site settings, scroll to sound, add the URL to the allow list.

## Running the Client

The best way to run the client is to use the included http-server. To do that, from your terminal enter the following:

```bash
npm install # First time only
npm run start
```

Then direct your web browser to "http://127.0.0.1/". Don't forget to allow Auto-Play for Audio on your browser!!

## get-box-state data from the Station Server

The data for idle is JSON in the following format (matching the BOX_ID and SEQUENCE_ID the box is configured for):

```json
{
  "BOX_ID": "1",
  "SEQUENCE_ID": "1",
  "supportingMedia": {
      "SEQUENCE_ID": "1",
      "BOX_ID": "1",
      "idleMedia": "w01_s01_idle.mp4",
      "unsuccessfulMedia": "w01_s01_unac.mp4"
    },
  "questItem": null,
  "lastUpdated": 1621559548,
  "guestVariantId": null,
  "guestSequenceId": null,
  "guestTokenId": null
}
```

In the above, notice:

- supportingMedia is an object. If NULL, the server quest config is not properly set!
- questItem is NULL (meaning, there is no Guest yet at the station since the Guest's token activates a particular questItem.)
- All the items in the box data are CASE SENSITIVE. 
- BOX_ID and SEQUENCE_ID are both strings, though that can hold quoted numbers like "1" or "01", etc. However, in internal logic, all comparisons are string based, so "01" != "1", etc.

The client application should POLL this get-box-state constantly and watch for changes.

**Guest Activation**

When a guest scans into the station, the above object's questItem property will be set to the following object:
```json
{
  "SEQUENCE_ID": "1",
  "BOX_ID": "1",
  "variantId": "B",
  "activeFlag": "Y",
  "successKeys": "D",
  "notActiveMedia": "",
  "activationMedia": "w01_s01_qB_activation.mp4",
  "mainMedia": "w01_s01_qB_main.mp4",
  "timeoutMedia": "w01_s01_qB_timeout.mp4",
  "retryMedia": "w01_s01_qB_retry.mp4",
  "failMedia": "w01_s01_qB_fail.mp4",
  "successMedia": "w01_s01_qB_win.mp4",
  "viewType": "MultiChoice",
  "retriesAllowed": 4
}
```

Note:
- All the items in the box data are CASE SENSITIVE (except "successKeys" so that the user can type either upper or lowercase answers.)