#!/usr/bin/env python

import sys, signal, time
import RPi.GPIO as GPIO
from mfrc522 import SimpleMFRC522

reader = SimpleMFRC522()

def signal_handler(signal, frame):
    print("\nRFID Reader is stopping")
    sys.exit(0)

while True:

    signal.signal(signal.SIGINT, signal_handler)

    try:
        print("\nReady to scan")
        id, sequenceId = reader.read()
        print("\nRFID: %d" % id)
        print("\nDetails: %s" % sequenceId)
        time.sleep(2)

    finally:
        GPIO.cleanup()
