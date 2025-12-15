import time
import cv2

cooldown_seconds = 60
last_activation_time = 0

# ---- Replace this with your ONNX detection ----
def fake_detect(frame):
    """
    Replace this with your real ONNX detection function.
    Return True when a pet/human is detected.
    """
    # For now, pretend there's a detection every few seconds:
    return True
# ------------------------------------------------

def main():
    global last_activation_time

    cap = cv2.VideoCapture(0)  # works for both USB & RPi cam using bcm2835-v4l2

    if not cap.isOpened():
        print("Camera failed to open!")
        return

    print("Running detection simulation...")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Frame grab failed.")
            continue

        detected = fake_detect(frame)

        current_time = time.time()

        if detected:
            time_since_last = current_time - last_activation_time

            if time_since_last >= cooldown_seconds:
                print("DETECTED → (allowed, cooldown expired)")
                last_activation_time = current_time
            else:
                remaining = int(cooldown_seconds - time_since_last)
                print(f"DETECTED → (ignored, {remaining}s cooldown remaining)")
        
        # Small delay to avoid spamming
        time.sleep(1)

    cap.release()

if __name__ == "__main__":
    main()
