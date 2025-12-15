import cv2
import time
from ultralytics import YOLO

from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import time, json

import RPi.GPIO as GPIO
import time

# ----------------------------
# Settings
# ----------------------------
COOLDOWN = 60  # seconds
last_trigger = 0
CAMERA_ID = 0  # 0 = USB webcam or PiCam visible as /dev/video0

SERVO_PIN = 18        # BCM pin
PWM_FREQ = 50         # 50Hz servo frequency

# Pulse widths (adjust for your servo)
PULSE_CLOSED = 1000   # µs
PULSE_OPEN   = 2000   # µs
PULSE_MID    = 1500   # µs


def us_to_duty(pulse_us):
    # Convert microseconds → % duty cycle for 50Hz PWM (20ms period)
    return (pulse_us / 20000.0) * 100.0

GPIO.setmode(GPIO.BCM)
GPIO.setup(SERVO_PIN, GPIO.OUT)

pwm = GPIO.PWM(SERVO_PIN, PWM_FREQ)
pwm.start(0)

# ----------------------------
# Setup AWS Client
# ----------------------------
client = AWSIoTMQTTClient("IOTreat")

client.configureEndpoint("a1u3m3kq33d8wk-ats.iot.us-east-1.amazonaws.com", 8883)
client.configureCredentials(
    "/home/cloudy7/Downloads/AmazonRootCA1.pem",
    "/home/cloudy7/Downloads/private.pem.key",
    "/home/cloudy7/Downloads/device-certificate.pem.crt"
)

client.connect()
print("Connected to AWS IoT!")

# ----------------------------
# Load YOLO model
# ----------------------------
print("[INFO] Loading YOLO model...")
model = YOLO("yolov8n.pt")  # small, fast, good for Pi

# ----------------------------
# Start camera
# ----------------------------
cap = cv2.VideoCapture(CAMERA_ID)

if not cap.isOpened():
    print("[ERROR] Could not open camera.")
    exit()

print("[INFO] Camera started.")
print(f"[INFO] Cooldown set to {COOLDOWN} seconds.\n")

# ----------------------------
# Helper Functions
# ----------------------------

def close_lid():
    print("Moving to CLOSED")
    pwm.ChangeDutyCycle(us_to_duty(PULSE_CLOSED))
    
def open_lid():
    print("Moving to OPEN")
    pwm.ChangeDutyCycle(us_to_duty(PULSE_OPEN))
    
def publish_msg(message):    
    payload = {"message": message}
    client.publish("iotreat/test", json.dumps(payload), 1)
    print("Published:", payload)  
    
    
# ----------------------------
# Detection Loop
# ----------------------------
while True:
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Failed to grab frame.")
        break

    # Run YOLO inference
    results = model(frame, verbose=False)

    detected = False
    detected_classes = []

    # Check detection results
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])

            # 0 = person, 15 = cat, 16 = dog (COCO ids)
            if cls_id in [0, 15, 16]:
                detected = True
                detected_classes.append(model.names[cls_id])

    current_time = time.time()

    if detected:
        if current_time - last_trigger >= COOLDOWN:
            print(f"[DETECTED] {detected_classes} detected!")
            
            print("Publishing message to cloud...")
            message = "{detected_classes} detected!"
            publish_msg(message)
                        
            print("Opening lid...")
            open_lid()
            
            
            message = "Dispensing food..."
            publish_msg(message)
            
            # TODO: Check weight with load cell
            print("Check weight with load cell")
            time.sleep(2)
            
            close_lid()
            message = "Food dispensed!..."
            publish_msg(message)
            
            last_trigger = current_time
            print(f"[DEBUG] Cooldown started for {COOLDOWN} seconds.\n")
            
        else:
            remaining = int(COOLDOWN - (current_time - last_trigger))
            print(f"[COOLDOWN ACTIVE] Detection ignored. {remaining}s left.\n")

    # Display camera window (optional)
    cv2.imshow("Camera", frame)

    # Quit when pressing 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

