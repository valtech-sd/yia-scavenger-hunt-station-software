#!/usr/bin/env python

import sys, signal, time
import RPi.GPIO as GPIO
from mfrc522 import SimpleMFRC522

reader = SimpleMFRC522()

def signal_handler(signal, frame):
    print("\nRFID Batch Writer has received the exit signal")
    sys.exit(0)

sequenceId = raw_input('Sequence Number [1..10]: ')
variantId = raw_input('Variant Assignment ["A", "B", "C"]: ')

while True:
    signal.signal(signal.SIGINT, signal_handler)

    try:
        print("Place the card to be written over the rfidScanner.")
        reader.write('{"sequenceId": \"'+sequenceId+'\", "variantId": \"'+variantId.upper()+'\"}')
        print("Card association complete.")
        time.sleep(2)

    finally:
       GPIO.cleanup()

# import RPi.GPIO as GPIO
# from mfrc522 import SimpleMFRC522
#
# reader = SimpleMFRC522()
# sequenceId = 0
# writeCard = ""
#
# try:
#     sequenceId = raw_input('Sequence Number [1..10]: ')
#     variantId = raw_input('Variant Assignment ["A", "B", "C"]: ')
#     writeCard = "Y"
#     while int(sequenceId) in range(1,10):
#         if writeCard.upper() == "Y":
#             print("Place the card to be written over the rfidScanner.")
#             reader.write('{"sequenceId": \"'+sequenceId+'\", "variantId": \"'+variantId.upper()+'\"}')
#             print("Card association complete.")
#             writeCard = raw_input('Write another card with the same information? [Y/N]: ')
#         elif writeCard.upper() == "N":
#             sequenceId = raw_input('Sequence Number [1..10]: ')
#             variantId = raw_input('Variant Assignment ["A", "B", "C"]: ')
#         else:
#             GPIO.cleanup()
#             exit()
# finally:
#    GPIO.cleanup()
