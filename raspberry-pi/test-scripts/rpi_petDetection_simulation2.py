import cv2
import time
from ultralytics import YOLO

# ----------------------------
# Settings
# ----------------------------
COOLDOWN = 60  # seconds
last_trigger = 0
CAMERA_ID = 0  # 0 = USB webcam or PiCam visible as /dev/video0

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
            print("[ACTION] Trigger event (your servo later).")
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
