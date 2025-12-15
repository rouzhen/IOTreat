#!/usr/bin/env python3
"""
pet_detector_with_servo_and_scale_gpio.py

- YOLO (ultralytics) detects 'person','dog','cat' from webcam.
- On detection: open lid via servo (RPi.GPIO PWM), read HX711 weight, close lid.
- Prints debug lines to console.

Requirements:
  pip install RPi.GPIO ultralytics opencv-python-headless numpy hx711
"""

import time
import sys
import numpy as np
import cv2

from ultralytics import YOLO

# ---- HX711 ----
try:
    from hx711 import HX711
except Exception as e:
    print("HX711 import failed:", e)
    print("Install hx711 package or adapt to your HX711 library.")
    sys.exit(1)

# ---- RPi.GPIO for servo (software PWM) ----
try:
    import RPi.GPIO as GPIO
except Exception as e:
    print("RPi.GPIO import failed:", e)
    print("Install RPi.GPIO:  pip install RPi.GPIO   (may require sudo)")
    sys.exit(1)

# ========= CONFIG =========
VIDEO_DEVICE_INDEX = 0
YOLO_MODEL = 'yolov8n.pt'
DETECT_CLASSES = ['person', 'dog', 'cat']
CONFIDENCE_THRESHOLD = 0.35

SERVO_GPIO = 18          # BCM pin
PWM_FREQ_HZ = 50         # 50Hz → period 20ms
SERVO_OPEN_PULSE = 2000  # microseconds  (tune for your servo)
SERVO_CLOSED_PULSE = 1000
SERVO_MOVE_DELAY = 1.0   # seconds

HX711_DAT_PIN = 5        # BCM
HX711_CLK_PIN = 6        # BCM
HX711_REF_FACTOR = 1     # calibrate for your scale

SCALE_READINGS = 10
SCALE_READ_DELAY = 0.05

LID_OPEN_TIMEOUT = 3.0
# =========================


def pulse_us_to_duty(pulse_us: float, period_ms: float = 20.0) -> float:
    """Convert pulse width in microseconds to duty cycle % for given period (default 20ms for 50Hz)."""
    duty = (pulse_us / (period_ms * 1000.0)) * 100.0
    # RPi.GPIO PWM expects 0..100
    return max(0.0, min(100.0, duty))


class ServoControllerGPIO:
    """Servo control using RPi.GPIO software PWM. Less precise than pigpio but sufficient if tuned."""
    def __init__(self, bcm_pin: int, freq_hz: int = 50):
        self.pin = bcm_pin
        self.freq = freq_hz
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.pin, GPIO.OUT)
        self.pwm = GPIO.PWM(self.pin, self.freq)
        self.pwm_started = False
        self.current_pulse = None

    def _ensure_started(self):
        if not self.pwm_started:
            self.pwm.start(0.0)
            self.pwm_started = True

    def set_pulse(self, pulse_us: int):
        self._ensure_started()
        duty = pulse_us_to_duty(pulse_us, period_ms=1000.0/self.freq*1000.0)  # still 20ms at 50Hz
        self.pwm.ChangeDutyCycle(duty)
        self.current_pulse = pulse_us
        # Small settle time is often needed for software PWM to update reliably
        time.sleep(0.02)

    def open_lid(self):
        print(f"[DEBUG] Servo: open (pulse={SERVO_OPEN_PULSE}us)")
        self.set_pulse(SERVO_OPEN_PULSE)

    def close_lid(self):
        print(f"[DEBUG] Servo: close (pulse={SERVO_CLOSED_PULSE}us)")
        self.set_pulse(SERVO_CLOSED_PULSE)

    def stop(self):
        print("[DEBUG] Servo: stop PWM and cleanup")
        try:
            if self.pwm_started:
                self.pwm.ChangeDutyCycle(0.0)
                self.pwm.stop()
        finally:
            GPIO.cleanup(self.pin)


class ScaleReader:
    def __init__(self, data_pin, clock_pin, reference_unit=1):
        self.hx = HX711(data_pin, clock_pin)
        self.hx.reset()
        self.hx.tare()
        self.reference_unit = reference_unit
        print("[DEBUG] Scale: tared; reference unit:", reference_unit)

    def read_weight(self, samples=10, delay=0.05):
        vals = []
        for _ in range(samples):
            try:
                vals.append(self.hx.get_weight(1))
            except Exception as e:
                print("[DEBUG] Scale read error:", e)
            time.sleep(delay)
        if not vals:
            return None
        avg = sum(vals) / len(vals)
        return (avg / self.reference_unit)


def main():
    print("[INFO] Starting pet/human detector (RPi.GPIO)")

    # Servo
    servo = ServoControllerGPIO(SERVO_GPIO, PWM_FREQ_HZ)

    # HX711
    try:
        scale = ScaleReader(HX711_DAT_PIN, HX711_CLK_PIN, reference_unit=HX711_REF_FACTOR)
    except Exception as e:
        print("[ERROR] HX711 init failed:", e)
        servo.stop()
        return

    # Initialize servo position
    servo.close_lid()
    time.sleep(0.6)

    # YOLO
    print("[DEBUG] Loading YOLO model:", YOLO_MODEL)
    model = YOLO(YOLO_MODEL)
    print("[DEBUG] YOLO loaded")

    # Camera
    cap = cv2.VideoCapture(VIDEO_DEVICE_INDEX)
    if not cap.isOpened():
        print("[ERROR] Could not open video device index", VIDEO_DEVICE_INDEX)
        servo.stop()
        return

    print("[INFO] Camera opened. Ctrl+C to stop.")
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("[DEBUG] Failed to read frame")
                time.sleep(0.2)
                continue

            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = model.predict(img, imgsz=640, conf=CONFIDENCE_THRESHOLD, verbose=False)
            det = results[0]
            boxes = det.boxes

            detected = False
            items = []

            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    conf = float(box.conf[0]) if hasattr(box.conf, "__len__") else float(box.conf)
                    cls_id = int(box.cls[0]) if hasattr(box.cls, "__len__") else int(box.cls)
                    name = model.names.get(cls_id, str(cls_id))
                    print(f"[DEBUG] Detected class={name}, conf={conf:.2f}")
                    if name in DETECT_CLASSES and conf >= CONFIDENCE_THRESHOLD:
                        detected = True
                        items.append((name, conf))

            if detected:
                print("[INFO] Target detected:", items)
                # Open lid
                servo.open_lid()
                time.sleep(SERVO_MOVE_DELAY)

                # Read scale
                print("[DEBUG] Waiting to settle on scale")
                time.sleep(0.5)
                weight = scale.read_weight(samples=SCALE_READINGS, delay=SCALE_READ_DELAY)
                if weight is None:
                    print("[DEBUG] No weight reading")
                else:
                    print(f"[INFO] Measured weight (apply your calibration): {weight:.2f}")

                # Keep open for a bit
                time.sleep(LID_OPEN_TIMEOUT)

                # Close lid
                servo.close_lid()
                time.sleep(SERVO_MOVE_DELAY)

            time.sleep(0.05)

    except KeyboardInterrupt:
        print("[INFO] Stopping...")

    finally:
        print("[DEBUG] Cleanup")
        servo.stop()
        cap.release()
        print("[INFO] Exiting")


if __name__ == "__main__":
    main()
