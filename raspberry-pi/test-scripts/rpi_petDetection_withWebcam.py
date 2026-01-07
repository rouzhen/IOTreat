#!/usr/bin/env python3
"""
pet_detector_with_servo_and_scale.py

- Uses a webcam to run YOLO (ultralytics) to detect 'person', 'dog', 'cat'
- When detection occurs: move servo -> open lid, sample weight via HX711, then close lid
- Prints debug lines to console

Requirements (pip):
  pip3 install pigpio opencv-python-headless numpy ultralytics hx711
Also ensure pigpiod is running:
  sudo systemctl start pigpiod
"""

import time
import threading
import sys
import numpy as np
import cv2

# YOLO (ultralytics)
from ultralytics import YOLO

# pigpio for servo
import pigpio

# HX711 library (package name hx711). If you used a different library adapt the import.
try:
    from hx711 import HX711
except Exception as e:
    print("HX711 import failed:", e)
    print("Install hx711 package or adapt the code to your HX711 library.")
    sys.exit(1)


# ---- CONFIG ----
VIDEO_DEVICE_INDEX = 0  # usually 0 for USB webcam
YOLO_MODEL = 'yolov8n.pt'  # default: tiny yolov8. Downloaded automatically by ultralytics if not present.
DETECT_CLASSES = ['person', 'dog', 'cat']  # classes we care about
CONFIDENCE_THRESHOLD = 0.35

SERVO_GPIO = 18  # BCM 18 (physical pin 12)
SERVO_OPEN_PULSE = 2000  # microseconds (experiment to find correct values for your servo)
SERVO_CLOSED_PULSE = 1000
SERVO_MOVE_DELAY = 1.0  # seconds to wait after movement

HX711_DAT_PIN = 5   # BCM 5 (GPIO5)
HX711_CLK_PIN = 6   # BCM 6 (GPIO6)
HX711_REF_FACTOR = 1  # calibration factor — you must calibrate your scale

SCALE_READINGS = 10  # number of readings to average per detection
SCALE_READ_DELAY = 0.05  # seconds between HX711 readings

# Lid open time after detection (we'll close after reading weight)
LID_OPEN_TIMEOUT = 3.0

# ---- END CONFIG ----


class ServoController:
    def __init__(self, gpio_pin, pi_handle):
        self.gpio = gpio_pin
        self.pi = pi_handle
        self.current_pulse = None
        # ensure pin is set as output by pigpio
        self.pi.set_mode(self.gpio, pigpio.OUTPUT)

    def set_pulse(self, pulse_us):
        self.pi.set_servo_pulsewidth(self.gpio, pulse_us)
        self.current_pulse = pulse_us

    def open_lid(self):
        print("[DEBUG] ServoController: Opening lid (pulse={}us)".format(SERVO_OPEN_PULSE))
        self.set_pulse(SERVO_OPEN_PULSE)

    def close_lid(self):
        print("[DEBUG] ServoController: Closing lid (pulse={}us)".format(SERVO_CLOSED_PULSE))
        self.set_pulse(SERVO_CLOSED_PULSE)

    def stop(self):
        print("[DEBUG] ServoController: Stopping servo PWM")
        self.pi.set_servo_pulsewidth(self.gpio, 0)  # stop pulses


class ScaleReader:
    def __init__(self, data_pin, clock_pin, reference_unit=1):
        # HX711 wrapper from hx711 package
        self.hx = HX711(data_pin, clock_pin)
        # Reset and set reading format
        self.hx.reset()
        self.hx.tare()  # remove offset
        self.reference_unit = reference_unit
        print("[DEBUG] ScaleReader: Tared scale and set reference unit placeholder:", reference_unit)

    def read_weight(self, samples=10, delay=0.05):
        vals = []
        for i in range(samples):
            try:
                v = self.hx.get_weight(1)
                vals.append(v)
            except Exception as e:
                print("[DEBUG] ScaleReader: read error:", e)
            time.sleep(delay)
        if not vals:
            return None
        avg = sum(vals)/len(vals)
        # apply calibration factor (you must calibrate using a known weight)
        weight_grams = (avg / self.reference_unit)
        return weight_grams


def main():
    print("[INFO] Starting pet/human detector")

    # initialize pigpio
    pi = pigpio.pi()
    if not pi.connected:
        print("[ERROR] pigpio daemon not running. Start it with: sudo systemctl start pigpiod")
        return

    servo = ServoController(SERVO_GPIO, pi)

    # HX711 scale
    try:
        scale = ScaleReader(HX711_DAT_PIN, HX711_CLK_PIN, reference_unit=HX711_REF_FACTOR)
    except Exception as e:
        print("[ERROR] Could not initialize HX711:", e)
        pi.stop()
        return

    # Set servo to closed position initially
    servo.close_lid()
    time.sleep(0.6)

    # load YOLO model
    print("[DEBUG] Loading YOLO model:", YOLO_MODEL)
    model = YOLO(YOLO_MODEL)  # this may download weights if needed
    print("[DEBUG] YOLO model loaded")

    # open camera
    cap = cv2.VideoCapture(VIDEO_DEVICE_INDEX)
    if not cap.isOpened():
        print("[ERROR] Could not open video device index", VIDEO_DEVICE_INDEX)
        servo.stop()
        pi.stop()
        return

    print("[INFO] Camera opened, starting capture loop. Press Ctrl+C to stop.")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("[DEBUG] Failed to read frame from camera")
                time.sleep(0.2)
                continue

            # To speed up, you might want to resize frame for detection (choose appropriate size)
            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # run YOLO inference (returns results list)
            results = model.predict(img, imgsz=640, conf=CONFIDENCE_THRESHOLD, verbose=False)
            detections = results[0]  # ultralytics returns list of results; take first for single image
            boxes = detections.boxes  # Boxes object (xyxy, confidence, cls)

            detected_interesting = False
            detected_items = []

            if boxes is not None and len(boxes) > 0:
                for i, box in enumerate(boxes):
                    conf = float(box.conf[0]) if hasattr(box.conf, "__len__") else float(box.conf)
                    cls_id = int(box.cls[0]) if hasattr(box.cls, "__len__") else int(box.cls)
                    name = model.names.get(cls_id, str(cls_id))
                    # debug line for each detection
                    print(f"[DEBUG] Detected class={name}, conf={conf:.2f}")

                    if name in DETECT_CLASSES and conf >= CONFIDENCE_THRESHOLD:
                        detected_interesting = True
                        detected_items.append((name, conf, box.xyxy[0].tolist()))

            if detected_interesting:
                print("[INFO] Target detected:", detected_items)
                # open lid
                servo.open_lid()
                time.sleep(SERVO_MOVE_DELAY)

                # wait a bit (allow object to be on scale) and sample weight
                print("[DEBUG] Waiting briefly for object to settle on scale")
                time.sleep(0.5)
                weight = scale.read_weight(samples=SCALE_READINGS, delay=SCALE_READ_DELAY)
                if weight is None:
                    print("[DEBUG] Failed to read weight from scale")
                else:
                    print(f"[INFO] Measured weight (raw, apply calibration): {weight:.2f} (units)")

                # keep lid open for LID_OPEN_TIMEOUT seconds (or close early)
                time.sleep(LID_OPEN_TIMEOUT)

                # close lid
                servo.close_lid()
                time.sleep(SERVO_MOVE_DELAY)

            # minimal delay to avoid pegging CPU
            time.sleep(0.05)

    except KeyboardInterrupt:
        print("[INFO] Stopping due to KeyboardInterrupt")

    finally:
        print("[DEBUG] Cleanup: stopping servo and pigpio")
        servo.stop()
        cap.release()
        pi.stop()
        print("[INFO] Exiting")

if __name__ == '__main__':
    main()
