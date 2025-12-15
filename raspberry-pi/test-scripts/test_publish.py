
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import time, json

client = AWSIoTMQTTClient("IOTreat")

client.configureEndpoint("a1u3m3kq33d8wk-ats.iot.us-east-1.amazonaws.com", 8883)
client.configureCredentials(
    "/home/cloudy7/Downloads/AmazonRootCA1.pem",
    "/home/cloudy7/Downloads/private.pem.key",
    "/home/cloudy7/Downloads/device-certificate.pem.crt"
)

client.connect()
print("Connected to AWS IoT!")

while True:
    payload = {"message": "hellogo home!"}
    client.publish("iotreat/test2", json.dumps(payload), 1)
    print("Published:", payload)
    time.sleep(3)



