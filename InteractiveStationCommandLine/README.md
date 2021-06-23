# InteractiveStationCommandLine - README

## Summary

These tools are intended to allow for easy RFID Card Management by allowing easy read and write functionality.

## readRFID.py
##    > python readRFID.py

This reader loops every 2 seconds, waiting for a card to appear in the read zone.
Ctrl-C escapes the reader.


## writeRFID.py
##    > python writeRFID.py

Prompts:
1) Sequence Number [1..10]: {INT} - An integer value that determines which quest is loaded.
2) Variant Assignment ["A", "B", "C"]: {alpha} - An alpha value that designates the sub-quest a user is on.

This is a batch writing tool. It will start a write listener every 2 seconds until it is closed.
Ctrl-C escapes the writer.
