import { apiGet, apiPost } from "./client";

const DEVICE_ID = "demo-device"; // matches mock-api.json

export function getStatus() {
  return apiGet(`/status?id=demo-device`).then((rows) => rows[0]);
}

export function getFeedingHistory() {
    return apiGet(`/GetFeedingHistory`)
        .then((rows) => rows[0]?.records || []);
}


export function getPets() {
    return apiGet(`/pets`);
}

export function sendCommand(action: string, amount?: number) {
    return apiPost(`/command`, { deviceId: DEVICE_ID, action, amount });
}


/*
import { apiGet, apiPost } from "./client";

const DEVICE_ID = "demo-device";

// --- 1. GET DASHBOARD STATUS (The Translator) ---
// This function fetches real data but formats it to match Dashboard.tsx
export async function getStatus() {
    try {
        // Fetch both History and Status from your Cloud
        const [historyData, petStatusData] = await Promise.all([
            apiGet('/feeding-history'),
            apiGet('/status')
        ]);

        console.log(">>> Raw History:", historyData);
        console.log(">>> Raw Status:", petStatusData);

        // Normalize History: Handle {"records": [...]} wrapper if it exists
        let logs = [];
        if (historyData && historyData.records) {
             logs = historyData.records; // Python wrapper format
        } else if (Array.isArray(historyData)) {
             logs = historyData; // Direct list format
        } else if (Array.isArray(historyData?.[0]?.records)) {
             logs = historyData[0].records; // Double wrapped
        }

        // Get the most recent log (First item)
        const lastLog = logs.length > 0 ? logs[0] : null;

        // --- CONSTRUCT THE OBJECT DASHBOARD EXPECTS ---
        return {
            // Calculated from real data
            feedingsToday: logs.length, 
            
            // Real Last Feeding Data
            lastFeeding: {
                pet: lastLog?.pet || lastLog?.pet_name || "No data",
                portion: lastLog?.amount || lastLog?.duration || 0,
                time: lastLog?.timestamp ? new Date(lastLog.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Never"
            },

            // Mock Data (Since we don't have sensors for these yet)
            foodLevel: 75, 
            lastMotionTime: "Recently", 
            bowlStatus: "Stable",
            bowlWeight: "Unknown", 
            recentPet: {
                name: lastLog?.pet || "Dog",
                breed: "Pet",
                time: "Recently"
            }
        };

    } catch (error) {
        console.error("Error building dashboard:", error);
        return null; // Returns null so Dashboard shows "Loading..." instead of crashing
    }
}

// --- 2. GET HISTORY LIST ---
export function getFeedingHistory() {
    return apiGet(`/feeding-history`).then((data) => {
        // Handle the wrapper {"records": []} from Python
        if (data && data.records) return data.records;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.[0]?.records)) return data[0].records;
        return [];
    });
}

// --- 3. GET PETS LIST ---
export function getPets() {
    // Returns the raw list for the Pets page
    return apiGet(`/status`);
}

// --- 4. SEND COMMAND ---
export function sendCommand(action: string, amount?: number) {
    return apiPost(`/command`, { deviceId: DEVICE_ID, action, amount });
}*/