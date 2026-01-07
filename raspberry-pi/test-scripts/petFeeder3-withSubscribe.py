import cv2
import time
from ultralytics import YOLO

from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import json
import RPi.GPIO as GPIO

# ============================================================
#                MUTABLE SETTINGS (LIVE FROM AWS)
# ============================================================
SETTINGS = {
    "cooldown": 60,        # seconds
    "grams": 5,            # simulated dispensing amount
}
SETTINGS_LOCK = False     # (simple lock for safety)

last_trigger = 0          # last dispense timestamp
CAMERA_ID = 0

# ============================================================
#                SERVO SETUP
# ============================================================
SERVO_PIN = 18
PWM_FREQ = 50

PULSE_CLOSED = 1000
PULSE_OPEN   = 2000

def us_to_duty(pulse_us):
    return (pulse_us / 20000.0) * 100.0

GPIO.setmode(GPIO.BCM)
GPIO.setup(SERVO_PIN, GPIO.OUT)

pwm = GPIO.PWM(SERVO_PIN, PWM_FREQ)
pwm.start(0)

def open_lid():
    print(">> SERVO: Opening lid")
    pwm.ChangeDutyCycle(us_to_duty(PULSE_OPEN))

def close_lid():
    print(">> SERVO: Closing lid")
    pwm.ChangeDutyCycle(us_to_duty(PULSE_CLOSED))

# ============================================================
#                AWS IoT SETUP
# ============================================================
client = AWSIoTMQTTClient("IOTreat")
client.configureEndpoint("a1u3m3kq33d8wk-ats.iot.us-east-1.amazonaws.com", 8883)
client.configureCredentials(
    "/home/cloudy7/Downloads/AmazonRootCA1.pem",
    "/home/cloudy7/Downloads/private.pem.key",
    "/home/cloudy7/Downloads/device-certificate.pem.crt"
)

def publish_msg(message):
    payload = {"message": message, "timestamp": int(time.time())}
    client.publish("iotreat/test", json.dumps(payload), 1)
    print("Published:", payload)

# ============================================================
#          SUBSCRIBE CALLBACK – MODIFY SETTINGS LIVE
# ============================================================
def on_settings_message(client, userdata, message):
    global SETTINGS

    print("\n===== AWS SETTINGS RECEIVED =====")
    try:
        incoming = json.loads(message.payload.decode("utf-8"))
    except:
        print("Invalid JSON received.")
        return

    # Update cooldown
    if "cooldown" in incoming:
        try:
            new_cd = int(incoming["cooldown"])
            SETTINGS["cooldown"] = new_cd
            print(f"Updated cooldown → {new_cd} sec")
        except:
            print("Cooldown value invalid, ignored.")

    # Update grams
    if "grams" in incoming:
        try:
            new_g = float(incoming["grams"])
            SETTINGS["grams"] = new_g
            print(f"Updated food amount → {new_g} grams")
        except:
            print("Gram value invalid, ignored.")

    print("=================================\n")

# ============================================================
#                CONNECT AWS & SUBSCRIBE
# ============================================================
client.connect()
print("Connected to AWS IoT!")

client.subscribe("iotreat/settings", 1, on_settings_message)
print("Subscribed to topic: iotreat/settings\n")

# ============================================================
#                LOAD YOLO MODEL
# ============================================================
print("[INFO] Loading YOLO model...")
model = YOLO("yolov8n.pt")

# ============================================================
#                START CAMERA
# ============================================================
cap = cv2.VideoCapture(CAMERA_ID)
if not cap.isOpened():
    print("[ERROR] Could not open camera.")
    exit()

print("[INFO] Camera started.")
print(f"[INFO] Cooldown = {SETTINGS['cooldown']} seconds\n")

# ============================================================
#                MAIN DETECTION LOOP
# ============================================================
while True:
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Frame grab failed.")
        break

    results = model(frame, verbose=False)

    detected = False
    detected_classes = []

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            if cls_id in [0, 15, 16]:  # person, cat, dog
                detected = True
                detected_classes.append(model.names[cls_id])

    now = time.time()

    if detected:
        cooldown = SETTINGS["cooldown"]

        if now - last_trigger >= cooldown:
            print(f"\n[DETECTED] {detected_classes}")

            publish_msg(f"{detected_classes} detected")

            # ---------------- SIMULATED DISPENSING ----------------
            print(">> Opening lid...")
            open_lid()

            print(f">> Dispensing {SETTINGS['grams']} grams (simulated)")
            publish_msg(f"Dispensing {SETTINGS['grams']} grams")
            time.sleep(2)

            close_lid()
            print(">> Food dispensed.\n")
            publish_msg("Food dispensed")

            last_trigger = now
            print(f"[COOLDOWN] {cooldown} seconds started\n")

        else:
            remaining = int(cooldown - (now - last_trigger))
            print(f"[COOLDOWN ACTIVE] {remaining}s remaining\n")

    cv2.imshow("Camera", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
