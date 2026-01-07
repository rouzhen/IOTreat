import RPi.GPIO as GPIO
import time

SERVO_PIN = 18        # BCM pin
PWM_FREQ = 50         # 50Hz servo frequency

# Pulse widths (adjust for your servo)
PULSE_CLOSED = 1800   # µs
PULSE_OPEN   = 2500   # µs
PULSE_MID    = 1500   # µs

def us_to_duty(pulse_us):
    # Convert microseconds → % duty cycle for 50Hz PWM (20ms period)
    return (pulse_us / 20000.0) * 100.0

GPIO.setmode(GPIO.BCM)
GPIO.setup(SERVO_PIN, GPIO.OUT)

pwm = GPIO.PWM(SERVO_PIN, PWM_FREQ)
pwm.start(0)

try:
    print("Moving to CLOSED")
    pwm.ChangeDutyCycle(us_to_duty(PULSE_CLOSED))
    time.sleep(5)

    print("Moving to OPEN")
    pwm.ChangeDutyCycle(us_to_duty(PULSE_OPEN))
    time.sleep(5)
    print("Moving to CLOSED")
    pwm.ChangeDutyCycle(us_to_duty(PULSE_CLOSED))
    time.sleep(5)


    print("Stopping (servo power off)")
    pwm.ChangeDutyCycle(0)
    time.sleep(0.5)

except KeyboardInterrupt:
    pass

finally:
    pwm.stop()
    GPIO.cleanup()
    print("Servo test finished.")