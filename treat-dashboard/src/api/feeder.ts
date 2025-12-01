import { apiGet, apiPost } from "./client";

const DEVICE_ID = "demo-device"; // matches mock-api.json

export function getStatus() {
  return apiGet(`/status?id=demo-device`).then((rows) => rows[0]);
}

export function getFeedingHistory() {
    return apiGet(`/feeding-history`)
        .then((rows) => rows[0]?.records || []);
}


export function getPets() {
    return apiGet(`/pets`);
}

export function sendCommand(action: string, amount?: number) {
    return apiPost(`/command`, { deviceId: DEVICE_ID, action, amount });
}
