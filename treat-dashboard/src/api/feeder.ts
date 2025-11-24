import { apiGet, apiPost } from "./client";

const DEVICE_ID = "demo-device"; // matches mock-api.json

export function getStatus() {
    return apiGet(`/status/${DEVICE_ID}`);
}

export function getFeedingHistory() {
    return apiGet(`/feeding-history/${DEVICE_ID}`);
}

export function getPets() {
    return apiGet(`/pets`);
}

export function sendCommand(action: string, amount?: number) {
    return apiPost(`/command`, { deviceId: DEVICE_ID, action, amount });
}
