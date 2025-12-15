#!/usr/bin/env python3
"""
IoTreat integrated pipeline with live AWS settings:
- YOLO detects person/cat/dog
- AWS IoT publishes messages
- Servo opens lid, food dispenses until HX711 reaches target weight
- Per-species cooldowns are live-updated via AWS IoT subscribe
"""

import time
import json
import sys
import traceback
import threading
import signal


# --- hardware & libs ---
import RPi.GPIO as GPIO
import cv2
import numpy as np


from hx711 import HX711
GPIO.cleanup()

# AWS IoT SDK
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient

# (Assumed) HX711 helper; replace with your actual module/class if different
# from hx711 import HX711

# (Assumed) YOLO (ultralytics); if your env differs, adapt the import/model load accordingly
# from ultralytics import YOLO

# ------------- GPIO / Hardware Config -------------
SERVO_PIN = 18           # PWM-capable pin
DISPENSER_PIN = 23       # Motor relay pin (example)
HX711_DT_PIN = 5         # HX711 DT
HX711_SCK_PIN = 6        # HX711 SCK

PWM_FREQ = 50            # Typical for hobby servos
SERVO_OPEN_DUTY = 7.5    # Tune to your horn angle
SERVO_CLOSED_DUTY = 5.0  # Tune to your horn angle

SLEEP_BETWEEN_FRAMES = 0.05

# ------------- AWS IoT (update endpoints and certificate file paths) -------------
AWS_CLIENT_ID = "IOTreat"
AWS_HOST = "a1u3m3kq33d8wk-ats.iot.us-east-1.amazonaws.com"
AWS_PORT = 8883
AWS_ROOT_CA = "/home/cloudy7/Downloads/AmazonRootCA1.pem"
AWS_PRIVATE_KEY = "/home/cloudy7/Downloads/private.pem.key"
AWS_CERT = "/home/cloudy7/Downloads/device-certificate.pem.crt"

AWS_TOPIC = "iotreat/petFeeder"
AWS_TOPIC_SUBSCRIBE = "iotreat/petFeederSettings"

# ------------- Detection / Model -------------
# MODEL_PATH = "/home/cloudy7/models/pets.pt"  # example; update to your .pt
CONF_THRESHOLD = 0.5
NMS_IOU = 0.45

# ------------- Live Settings (defaults) -------------
SETTINGS = {
    "cat":   {"cooldown": 120, "grams": 50.0},
    "dog":   {"cooldown": 120, "grams": 50.0},
    "human": {"cooldown": 60,  "grams": 0.0},  # if "human" is used for gating only
}
SETTINGS_LOCK = threading.Lock()

# Track last dispense time per species
LAST_DISPENSE = {
    "cat": 0.0,
    "dog": 0.0,
    "human": 0.0
}

# ------------- Graceful Exit Flag -------------
RUNNING = True


# =========================
# Hardware Helpers
# =========================
def gpio_init():
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(SERVO_PIN, GPIO.OUT)
    GPIO.setup(DISPENSER_PIN, GPIO.OUT)
    GPIO.output(DISPENSER_PIN, GPIO.LOW)  # motor off by default


def gpio_cleanup():
    try:
        GPIO.output(DISPENSER_PIN, GPIO.LOW)
    except Exception:
        pass
    GPIO.cleanup()


def servo_open(pwm):
    pwm.ChangeDutyCycle(SERVO_OPEN_DUTY)
    time.sleep(0.3)


def servo_close(pwm):
    pwm.ChangeDutyCycle(SERVO_CLOSED_DUTY)
    time.sleep(0.3)


def dispenser_on():
    GPIO.output(DISPENSER_PIN, GPIO.HIGH)


def dispenser_off():
    GPIO.output(DISPENSER_PIN, GPIO.LOW)


# Calibration values (UPDATE IF YOU RECALIBRATE)
OFFSET = -131480   # No-load raw reading
SCALE  = 1563.7    # Counts per gram

def hx711_init():
    """
    Initialize HX711 and return the handle.
    Mirrors your working setup: reset → power_up → short settle.
    """
    # GPIO.setmode(GPIO.BCM)  # already done in gpio_init(); don't call twice
    hx = HX711(HX711_DT_PIN, HX711_SCK_PIN)
    hx.reset()
    hx.power_up()
    time.sleep(0.2)
    return hx

def hx711_read_grams(hx_handle):
    """
    Read raw value and convert to grams using OFFSET/SCALE.
    Handles list payloads and None safely.
    Returns a non-negative float (grams).
    """
    raw = hx_handle.get_raw_data()

    # Convert list → integer (some drivers return [value])
    if isinstance(raw, list):
        if not raw:
            return 0.0
        raw = raw[0]

    if raw is None:
        return 0.0

    grams = (raw - OFFSET) / SCALE
    return max(0.0, float(grams))

# =========================
# AWS IoT Helpers
# =========================
def build_aws_client():
    client = AWSIoTMQTTClient(AWS_CLIENT_ID)
    client.configureEndpoint(AWS_HOST, AWS_PORT)
    client.configureCredentials(AWS_ROOT_CA, AWS_PRIVATE_KEY, AWS_CERT)

    # Safe behavior
    client.configureAutoReconnectBackoffTime(1, 32, 20)
    client.configureOfflinePublishQueueing(-1)   # infinite
    client.configureDrainingFrequency(2)         # Hz
    client.configureConnectDisconnectTimeout(10) # sec
    client.configureMQTTOperationTimeout(5)      # sec
    return client


def publish_msg(aws_client, event, payload=None, qos=1):
    msg = {"event": event, "ts": int(time.time()*1000)}
    if payload:
        msg.update(payload)
    try:
        aws_client.publish(AWS_TOPIC, json.dumps(msg), qos)
    except Exception as e:
        print("[AWS] Publish error:", e)


# Subscription callback: update SETTINGS from incoming JSON
def on_settings_message(client, userdata, message):
    print("\n=== AWS SETTINGS RECEIVED ===")
    print("Topic:", message.topic)
    try:
        payload_str = message.payload.decode("utf-8", errors="replace")
        print("Raw payload:", payload_str)
        incoming = json.loads(payload_str)
    except Exception as e:
        print("Payload decode/JSON error:", e, "\n")
        return

    updated = {}

    def apply_update(species, fields):
        nonlocal updated
        species = str(species).lower()
        if species not in SETTINGS:
            return
        with SETTINGS_LOCK:
            if "cooldown" in fields:
                try:
                    cd = int(fields["cooldown"])
                    if cd >= 0:
                        SETTINGS[species]["cooldown"] = cd
                except Exception:
                    pass
            if "grams" in fields:
                try:
                    g = float(fields["grams"])
                    if g >= 0:
                        SETTINGS[species]["grams"] = g
                except Exception:
                    pass
            updated[species] = dict(SETTINGS[species])

    # Accept either:
    # 1) Flat: {"species": "cat", "cooldown": 90, "grams": 40}
    # 2) Map:  {"cat": {"cooldown": 90, "grams": 40}, "dog": {"cooldown": 150}}
    if isinstance(incoming, dict) and "species" in incoming:
        apply_update(incoming.get("species"), incoming)
    elif isinstance(incoming, dict):
        for sp, fields in incoming.items():
            if isinstance(fields, dict):
                apply_update(sp, fields)

    if updated:
        print("Updated settings:", updated, "\n")
        try:
            publish_msg(client, "settings_updated", {"updated": updated})
        except Exception:
            pass
    else:
        print("No valid setting fields found.\n")


# =========================
# Vision / Detection
# =========================
def open_camera():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Camera not available")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    return cap


def detect_species(frame):
    """
    Return one of {"cat","dog","human",None} based on your actual detector.
    This is a stub; plug in your YOLO inference here and map labels→species.
    """
    # Example passthrough: always return None
    return None, frame  # (species, annotated_frame)


# =========================
# Dispense Logic
# =========================
def can_dispense(species):
    now = time.time()
    with SETTINGS_LOCK:
        cd = SETTINGS.get(species, {}).get("cooldown", 60)
    last = LAST_DISPENSE.get(species, 0.0)
    return (now - last) >= cd


def mark_dispensed(species):
    LAST_DISPENSE[species] = time.time()


def dispense_to_target(hx_handle, pwm, species, aws_client):
    with SETTINGS_LOCK:
        target_grams = SETTINGS.get(species, {}).get("grams", 50.0)

    if target_grams <= 0:
        publish_msg(aws_client, "skip_dispense", {"species": species, "reason": "target_grams<=0"})
        return

    publish_msg(aws_client, "dispense_start", {"species": species, "target_grams": target_grams})
    try:
        servo_open(pwm)
        dispenser_on()

        t0 = time.time()
        while True:
            grams = hx711_read_grams(hx_handle)
            # Optional: publish progress sparsely
            if int((time.time() - t0) * 10) % 10 == 0:  # ~1 Hz
                publish_msg(aws_client, "dispense_progress", {"species": species, "grams": grams})

            if grams >= target_grams:
                break
            time.sleep(0.05)

    finally:
        dispenser_off()
        servo_close(pwm)

    mark_dispensed(species)
    publish_msg(aws_client, "dispense_done", {"species": species, "reached_grams": float(target_grams)})


# =========================
# Main
# =========================
def handle_sigint(sig, frame):
    global RUNNING
    RUNNING = False


def main():
    global RUNNING

    print("[INIT] GPIO/Hardware...")
    gpio_init()
    pwm = GPIO.PWM(SERVO_PIN, PWM_FREQ)
    pwm.start(SERVO_CLOSED_DUTY)

    print("[INIT] HX711...")
    hx_handle = hx711_init()

    print("[INIT] Camera...")
    cap = open_camera()

    # print("[INIT] Model...")
    # model = YOLO(MODEL_PATH)

    print("[AWS] Connecting...")
    aws_client = build_aws_client()
    aws_client.connect()
    print("[AWS] Connected.")

    # Subscribe for live settings updates
    aws_client.subscribe(AWS_TOPIC_SUBSCRIBE, 1, on_settings_message)
    print(f"[AWS] Subscribed to: {AWS_TOPIC_SUBSCRIBE}")

    # Announce ready + current defaults
    with SETTINGS_LOCK:
        publish_msg(aws_client, "device_ready", {"settings": SETTINGS})

    signal.signal(signal.SIGINT, handle_sigint)

    print("[RUN] Press Ctrl+C to exit.")
    try:
        while RUNNING:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue

            species, annotated = detect_species(frame)

            # If your detector returns labels, map them → species names you use in SETTINGS
            if species in ("cat", "dog"):  # gate on your real logic
                if can_dispense(species):
                    publish_msg(aws_client, "species_detected", {"species": species})
                    dispense_to_target(hx_handle, pwm, species, aws_client)
                else:
                    with SETTINGS_LOCK:
                        cd = SETTINGS[species]["cooldown"]
                    since = time.time() - LAST_DISPENSE.get(species, 0.0)
                    publish_msg(aws_client, "cooldown_active", {
                        "species": species,
                        "cooldown_s": cd,
                        "elapsed_s": int(since)
                    })

            # Show preview (optional; comment out if headless)
            try:
                cv2.imshow("IoTreat", annotated)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    RUNNING = False
            except Exception:
                # Ignore headless / framebuffer issues safely
                pass

            time.sleep(SLEEP_BETWEEN_FRAMES)

    except Exception as e:
        print("[ERROR] Unhandled exception:", e)
        traceback.print_exc()
    finally:
        print("[EXIT] Cleaning up...")
        try:
            cap.release()
        except Exception:
            pass
        try:
            cv2.destroyAllWindows()
        except Exception:
            pass
        try:
            pwm.stop()
        except Exception:
            pass
        try:
            if hx_handle is not None:
                hx_handle.power_down()
        except Exception:
            pass
        try:
            aws_client.disconnect()
        except Exception:
            pass
        gpio_cleanup()
        print("[EXIT] Done.")


if __name__ == "__main__":
    main()
