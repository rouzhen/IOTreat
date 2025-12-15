# IoTreat

IoTreat is a cloud-connected, event-driven IoT pet feeder system designed to support multi-pet households.  
The system combines an interactive web dashboard with a serverless AWS backend and a Raspberry Pi–based feeder device to enable controlled, automated, and observable feeding.

This repository contains the web dashboard and client-side integration code for the IoTreat system, along with documentation describing the associated AWS cloud services configured for the project.

---

## System Overview

IoTreat follows a cloud-native, event-driven architecture.  
All backend computation is triggered by explicit events originating from either:

- User interactions on the web dashboard, or
- Telemetry and sensing events from the IoT feeder device.

Rather than using a monolithic backend service, the system is composed of multiple specialized pipelines built on AWS managed services, including:

- AWS IoT Core (MQTT-based device communication)
- AWS Lambda (serverless backend logic)
- Amazon DynamoDB (feeding logs and device state)
- Amazon EventBridge Scheduler (time-based automation)
- Amazon S3 (pet profile image storage)

The frontend interacts with these pipelines through HTTP APIs exposed via Amazon API Gateway.

---

## Repository Structure
```text
IOTreat/
├── treat-dashboard/       # Frontend dashboard
│   ├── src/
│   │   ├── pages/        # Dashboard views (Dashboard, History, Pets, Controls, Onboarding)
│   │   ├── components/   # Reusable UI components
│   │   ├── apis/         # HTTP API wrappers for AWS Lambda endpoints
│   │   └── assets/       # Images, icons, and other assets
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── raspberry-pi/         # Raspberry Pi code for the IoTreat system
│   ├── test-scripts/     # Scripts for testing individual components
│   │   ├── test_loadcell3.py       # HX711/load cell testing
│   │   ├── test_servo.py           # Servo motor testing
│   │   ├── test_publish.py         # MQTT publish testing
│   │   ├── test_subscribe.py       # MQTT subscription testing
|   |   └── other simulation & integration scripts...
│   ├── rpi_petDetection_integrated.py # Integrated script with detection, servo, HX711, and MQTT publish
│   └── petFeeder_CLOUDY7.py        # Full integration with detection, servo, HX711, MQTT publish + subscribe
├── README.md
```

---

## Repository Organization Note

### Frontend
All application code is contained within the `treat-dashboard/` directory.  
This includes the React frontend and client-side API integration logic.

Backend cloud components (AWS IoT Core, Lambda functions, DynamoDB tables, EventBridge schedules, and S3 buckets) are provisioned and managed directly through the AWS Console rather than through Infrastructure-as-Code files stored in this repository.

This structure reflects the project’s focus on cloud service orchestration, event-driven backend design, and system behavior rather than deployment automation.

### Backend
- `raspberry-pi/`: Contains all scripts intended to run on the Raspberry Pi for edge processing and hardware control.

   - `test-scripts/`: Scripts for testing individual components (load cell, servo, MQTT communication) independently.

   - Integration scripts:

      - `petFeeder_CLOUDY7.py`: *Full* integration including MQTT publish and subscribe, suitable for demo or production scenarios.

      - `rpi_petDetection_integrated.py`: Combines detection, servo, HX711, and MQTT publish only.

This structure separates testing and development of individual hardware/software components from fully integrated system operation, facilitating iterative development, debugging, and safe demonstration on the Raspberry Pi.


---

## Web Dashboard

The IoTreat web dashboard is implemented using **React with Vite**.

### Key Features
- Manual feeding control
- Real-time feeder and bowl status
- Feeding history visualization
- Pet profile management
- Configuration of portion size, cooldown period, and feeding schedules

### Design Choices
- Vite was selected for fast build times and a lightweight development workflow.
- Utility-based CSS is used to enable rapid UI iteration.
- Mock API responses were used during early development to decouple frontend progress from backend readiness.

### Frontend–Backend Interaction
Each dashboard action maps directly to a backend pipeline:
- Manual feed → `POST /command`
- Dashboard status → `GET /status`
- Feeding history → `GET /feeding-history`
- Pet onboarding → `POST /add-pet-profile`

---

## Cloud Backend Architecture (High-Level)

The backend is implemented using a **serverless, event-driven architecture** on AWS.

### Core Responsibilities
- Receive telemetry and status updates from the feeder
- Process manual and scheduled feeding requests
- Enforce per-pet cooldown logic
- Publish control commands to the device
- Persist feeding events and device state

### Key AWS Services
- **AWS IoT Core**: Secure MQTT communication with the Raspberry Pi feeder
- **AWS Lambda**: Stateless backend logic for command processing and data ingestion
- **Amazon DynamoDB**: Feeding logs and device/pet state
- **Amazon EventBridge Scheduler**: Time-based feeding evaluation
- **Amazon S3**: Pet profile image storage

Long-running servers and container-based services (e.g. ECS) are intentionally avoided, as backend computation is only required in response to discrete events.

---

## Scheduled Feeding Behavior

Scheduled feeding is implemented using **Amazon EventBridge Scheduler** as a time-based trigger for conditional evaluation, not as a blind dispensing mechanism.

At predefined feeding windows (e.g. morning and evening):

1. EventBridge invokes the `SmartFeederLogic` Lambda function.
2. The Lambda function evaluates feeding conditions, including:
   - Whether a pet is currently detected by the feeder
   - Whether the detected pet has exceeded its cooldown interval
3. A dispensing command is published to AWS IoT Core **only if all conditions are satisfied**.
4. Feeding events are recorded only after the device reports successful physical dispensing.

This design prevents overfeeding, supports multiple pets, and keeps scheduling logic centralized in the cloud without requiring persistent timers on the device.

---

## Deployment Notes

- The frontend dashboard is deployed on **Vercel**.
- AWS backend services are configured via the AWS Console.
- The Raspberry Pi feeder maintains a persistent MQTT connection to AWS IoT Core using X.509 certificates.

---

## Project Scope

This repository is intended for academic and prototyping purposes.  
It prioritizes architectural clarity, cloud integration, and event-driven system design over production hardening or full infrastructure automation.


