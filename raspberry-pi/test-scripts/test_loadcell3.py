#!/usr/bin/env python3
import time
import RPi.GPIO as GPIO
from hx711 import HX711
GPIO.cleanup()
# ------------------------------
# PIN setup
# ------------------------------
DT_PIN = 5       # HX711 DOUT pin
SCK_PIN = 6      # HX711 SCK pin

# ------------------------------
# Calibration values (UPDATE THESE)
# ------------------------------
OFFSET = -131480     # No-load raw reading
SCALE = 1563.7        # Counts per gram

# ------------------------------
# HX711 Setup
# ------------------------------
GPIO.setmode(GPIO.BCM)
hx = HX711(DT_PIN, SCK_PIN)

hx.reset()
hx.power_up()
time.sleep(0.2)

def raw_to_grams(raw):
    """Convert HX711 raw value to grams."""
    return (raw - OFFSET) / SCALE

print("Reading HX711 (RAW + grams)... Press Ctrl+C to stop.")

try:
    while True:
        raw = hx.get_raw_data()

        # ------------------------------
        # FIX: convert list → integer
        # ------------------------------
        if isinstance(raw, list):
            if len(raw) == 0:
                print("No data")
                continue
            raw = raw[0]

        if raw is None:
            print("No data")
            continue

        grams = raw_to_grams(raw)
        print(f"Raw: {raw:10}   |   {grams:8.2f} g")

        time.sleep(0.2)

except KeyboardInterrupt:
    print("\nStopping...")

finally:
    hx.power_down()
    GPIO.cleanup()