#!/usr/bin/env python3
"""
IoTreat integrated pipeline:
- YOLOv8 detects person/cat/dog
- AWS IoT publishes messages
- Servo opens lid, food dispenses until HX711 reaches target weight
- Per-species cooldowns
"""

import time
import json
import sys
import traceback

# --- hardware & libs ---
import RPi.GPIO as GPIO
from hx711 import HX711
import cv2
from ultralytics import YOLO
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient

# ----------------------------
# CONFIG
# ----------------------------
# Camera
CAMERA_ID = 0

# YOLO
YOLO_MODEL = "yolov8n.pt"   # small model for Pi

# Detection classes to accept (COCO ids)
# 0 = person, 15 = cat, 16 = dog
ALLOWED_CLASS_IDS = {0: "human", 15: "cat", 16: "dog"}

# Per-species cooldowns (seconds)
COOLDOWNS = {
    "human": 60,   # for testing you may want small values
    "cat": 120,
    "dog": 120
}

# Servo (lid) settings
SERVO_PIN = 18         # BCM pin connected to servo signal
PWM_FREQ = 50          # Hz
PULSE_CLOSED = 1000    # µs (adjust for your servo)
PULSE_OPEN   = 2000    # µs (adjust)

# HX711 pins
DT_PIN = 5
SCK_PIN = 6

# Calibration — set these AFTER you calibrate
HX_OFFSET = -131480      # raw no-load
HX_SCALE = 1563.7        # counts per gram

# Dispensing control
TARGET_GRAMS = 50.0      # how much food to dispense for this detection (change to desired)
MAX_DISPENSE_TIME = 30   # seconds - safety timeout in case dispensing fails
READ_SAMPLES = 3         # how many get_raw_data() samples to sample per reading

# AWS IoT (update endpoints and certificate file paths)
AWS_CLIENT_ID = "IOTreat"
AWS_HOST = "a1u3m3kq33d8wk-ats.iot.us-east-1.amazonaws.com"
AWS_PORT = 8883
AWS_ROOT_CA = "/home/cloudy7/Downloads/AmazonRootCA1.pem"
AWS_PRIVATE_KEY = "/home/cloudy7/Downloads/private.pem.key"
AWS_CERT = "/home/cloudy7/Downloads/device-certificate.pem.crt"
AWS_TOPIC = "iotreat/test"

# Misc
SLEEP_BETWEEN_FRAMES = 0.05

# ----------------------------
# Helper functions
# ----------------------------
def us_to_duty(pulse_us):
    """Convert microseconds -> duty cycle percentage for 50Hz (20ms period)."""
    return (pulse_us / 20000.0) * 100.0

def publish_msg(client, text, extra=None):
    payload = {"message": text, "ts": int(time.time())}
    if extra:
        payload.update(extra)
    client.publish(AWS_TOPIC, json.dumps(payload), 1)
    print("[AWS] Published:", payload)

def get_single_raw(hx):
    """
    Ask the hx711 lib for raw data. Some libs return a list of samples,
    some return ints. Handle both.
    """
    raw = hx.get_raw_data()
    # hx.get_raw_data() may return None, int, or list
    if raw is None:
        return None
    if isinstance(raw, list):
        if len(raw) == 0:
            return None
        return raw[0]
    return int(raw)

def read_weight_grams(hx, samples=READ_SAMPLES, delay=0.02):
    """Return average grams from `samples` raw readings (or None)."""
    raws = []
    for _ in range(samples):
        r = get_single_raw(hx)
        if r is None:
            # skip this sample but continue trying others
            time.sleep(delay)
            continue
        raws.append(r)
        time.sleep(delay)
    if not raws:
        return None
    avg_raw = sum(raws) / len(raws)
    grams = (avg_raw - HX_OFFSET) / HX_SCALE
    return grams, avg_raw

# ----------------------------
# Setup hardware
# ----------------------------
GPIO.setmode(GPIO.BCM)

# Servo PWM
GPIO.setup(SERVO_PIN, GPIO.OUT)
pwm = GPIO.PWM(SERVO_PIN, PWM_FREQ)
pwm.start(0)

def open_lid():
    print("[SERVO] Opening lid")
    pwm.ChangeDutyCycle(us_to_duty(PULSE_OPEN))
    # give servo a short time to move
    time.sleep(0.6)
    pwm.ChangeDutyCycle(0)

def close_lid():
    print("[SERVO] Closing lid")
    pwm.ChangeDutyCycle(us_to_duty(PULSE_CLOSED))
    time.sleep(0.6)
    pwm.ChangeDutyCycle(0)

# HX711 setup
hx = HX711(DT_PIN, SCK_PIN)
hx.reset()
hx.power_up()
time.sleep(0.1)

# YOLO model
print("[YOLO] Loading model...")
model = YOLO(YOLO_MODEL)
print("[YOLO] Model loaded.")

# AWS client connect
aws_client = AWSIoTMQTTClient(AWS_CLIENT_ID)
aws_client.configureEndpoint(AWS_HOST, AWS_PORT)
aws_client.configureCredentials(AWS_ROOT_CA, AWS_PRIVATE_KEY, AWS_CERT)
aws_client.connect()
print("[AWS] Connected.")

# Camera
cap = cv2.VideoCapture(CAMERA_ID)
if not cap.isOpened():
    print("[ERROR] Could not open camera.")
    sys.exit(1)

# Track last triggered time per species
last_trigger = {name: 0 for name in COOLDOWNS.keys()}

print("[INFO] Starting detection loop. Press Ctrl+C to stop.")

# ----------------------------
# Main loop
# ----------------------------
try:
    while True:
        ret, frame = cap.read()
        if not ret:
            print("[ERROR] Failed to read frame.")
            time.sleep(0.2)
            continue

        # YOLO inference
        results = model(frame, verbose=False)

        # find allowed detections
        detections = []
        for r in results:
            if not hasattr(r, "boxes") or r.boxes is None:
                continue
            for box in r.boxes:
                cls_id = int(box.cls[0]) if hasattr(box.cls, "__len__") else int(box.cls)
                if cls_id in ALLOWED_CLASS_IDS:
                    detections.append(ALLOWED_CLASS_IDS[cls_id])

        if detections:
            # If multiple classes found, we will process each unique class separately.
            unique = list(dict.fromkeys(detections))  # preserve order but unique
            now = time.time()
            for species in unique:
                cooldown = COOLDOWNS.get(species, 60)
                last = last_trigger.get(species, 0)
                if now - last < cooldown:
                    # Already fed recently
                    remaining = int(cooldown - (now - last))
                    msg = f"{species} detected but already fed. cooldown {remaining}s remaining."
                    print("[INFO]", msg)
                    publish_msg(aws_client, msg, {"species": species, "status": "already_fed"})
                    continue

                # Not in cooldown: begin feeding pipeline for this species
                print(f"[DETECT] {species} detected and eligible for feeding.")
                publish_msg(aws_client, f"{species} detected - starting feed", {"species": species, "stage": "detected"})

                # Open lid
                open_lid()
                publish_msg(aws_client, f"{species} - dispensing started", {"species": species, "stage": "dispensing"})

                # Dispensing: monitor weight until TARGET_GRAMS reached
                start_dispense = time.time()
                finished = False
                while time.time() - start_dispense <= MAX_DISPENSE_TIME:
                    read = read_weight_grams(hx, samples=READ_SAMPLES)
                    if read is None:
                        print("[HX711] No reading yet... waiting")
                        time.sleep(0.2)
                        continue
                    grams, rawavg = read
                    print(f"[HX711] avg_raw={rawavg:.0f}  grams={grams:.2f}")

                    if grams >= TARGET_GRAMS:
                        finished = True
                        break

                    # else keep dispensing, sleep small interval
                    time.sleep(0.2)

                if finished:
                    publish_msg(aws_client, f"{species} - finished dispensing, cooldown started", {"species": species, "stage": "finished", "grams": round(grams,2)})
                    print(f"[INFO] Finished dispensing for {species}: {grams:.2f} g")
                else:
                    # timeout safety
                    publish_msg(aws_client, f"{species} - dispensing timeout (safety)", {"species": species, "stage": "timeout"})
                    print(f"[WARN] Dispensing timeout for {species}. Last grams: {grams if 'grams' in locals() else 'N/A'}")

                # Close lid and set cooldown
                close_lid()
                last_trigger[species] = time.time()
                print(f"[DEBUG] {species} cooldown set for {cooldown} seconds.\n")

        # optional: show frame
        cv2.imshow("Camera", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

        time.sleep(SLEEP_BETWEEN_FRAMES)

except KeyboardInterrupt:
    print("\n[INFO] Stopping by user.")

except Exception as e:
    print("[ERROR] Exception occurred:", e)
    traceback.print_exc()

finally:
    print("[CLEANUP] cleaning up...")
    try:
        pwm.stop()
    except:
        pass
    try:
        GPIO.cleanup()
    except:
        pass
    try:
        hx.power_down()
    except:
        pass
    try:
        cap.release()
        cv2.destroyAllWindows()
    except:
        pass
    try:
        aws_client.disconnect()
    except:
        pass
    print("[EXIT] Done.")
