#!/usr/bin/env python3
import time
import json
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient

# ---------------------------
# AWS CONFIG
# ---------------------------
CLIENT_ID = "IOTreat"
AWS_HOST = "a1u3m3kq33d8wk-ats.iot.us-east-1.amazonaws.com"
AWS_PORT = 8883
ROOT_CA = "/home/cloudy7/Downloads/AmazonRootCA1.pem"
PRIVATE_KEY = "/home/cloudy7/Downloads/private.pem.key"
CERT = "/home/cloudy7/Downloads/device-certificate.pem.crt"
SUB_TOPIC = "iotreat/petFeederSettings"

# ---------------------------
# Callback for received messages
# ---------------------------
def callback(client, userdata, message):
    print("\n=== AWS MESSAGE RECEIVED ===")
    print("Topic:", message.topic)
    try:
        payload = message.payload.decode()
        print("Payload:", payload)
        print("============================\n")
    except:
        print("Payload decode error\n")

# ---------------------------
# MAIN
# ---------------------------
def main():
    print("[INFO] Initializing AWS IoT client...")

    client = AWSIoTMQTTClient(CLIENT_ID)
    client.configureEndpoint(AWS_HOST, AWS_PORT)
    client.configureCredentials(ROOT_CA, PRIVATE_KEY, CERT)

    # Safe settings
    client.configureAutoReconnectBackoffTime(1, 32, 20)
    client.configureOfflinePublishQueueing(-1)
    client.configureDrainingFrequency(2)
    client.configureConnectDisconnectTimeout(10)
    client.configureMQTTOperationTimeout(5)

    print("[INFO] Connecting...")
    client.connect()
    time.sleep(1)

    print(f"[INFO] Subscribing to topic: {SUB_TOPIC}")
    client.subscribe(SUB_TOPIC, 1, callback)

    print("[INFO] Listening... Press Ctrl+C to exit.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("[INFO] Exiting...")
    finally:
        client.disconnect()
        print("[INFO] Done.")


if __name__ == "__main__":
    main()