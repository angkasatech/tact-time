/**
 * database.js
 * All records are stored server-side in data/records.json via REST API.
 * This ensures all tablets/devices share the same data.
 */

const API_BASE = '/api';

/**
 * Generate unique ID using timestamp + random string
 */
export const generateId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`;
};

/**
 * Calculate duration in seconds and minutes, excluding paused time
 */
const calculateDuration = (startTime, endTime, totalPausedTime = 0) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const rawMs = end - start;
    const workMs = Math.max(0, rawMs - totalPausedTime);
    const durationSeconds = Math.floor(workMs / 1000);
    const durationMinutes = Math.round(durationSeconds / 60 * 100) / 100;
    return { durationSeconds, durationMinutes };
};

/**
 * Save a completed record to the server (data/records.json)
 * @param {Object} record - { vin, category, startTime, endTime, totalPausedTime }
 * @returns {Promise<boolean>}
 */
export const saveRecord = async (record) => {
    const maxRetries = 3;

    const { durationSeconds, durationMinutes } = calculateDuration(
        record.startTime,
        record.endTime,
        record.totalPausedTime || 0
    );

    const newRecord = {
        id: generateId(),
        dateCreated: new Date().toISOString(),
        vin: record.vin,
        category: record.category,
        startTime: record.startTime,
        endTime: record.endTime,
        totalPausedTime: record.totalPausedTime || 0,
        durationSeconds,
        durationMinutes
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const res = await fetch(`${API_BASE}/records`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecord)
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            return true;
        } catch (error) {
            console.error(`Save attempt ${attempt + 1} failed:`, error);
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
            }
        }
    }

    return false;
};

/**
 * Get all records from the server
 * @returns {Promise<Array>}
 */
export const getAllRecords = async () => {
    try {
        const res = await fetch(`${API_BASE}/records`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error('Error fetching records:', error);
        return [];
    }
};

/**
 * Initialize the database (no-op for server-side storage, kept for compatibility)
 */
export const initializeDatabase = async () => {
    // Server handles initialization automatically
};

/**
 * Poll for new records every intervalMs milliseconds.
 * Returns a cleanup function to stop polling.
 * @param {Function} callback - Called with latest records array
 * @param {number} intervalMs - Polling interval (default 60s)
 * @returns {Function} cleanup
 */
export const onRecordSaved = (callback, intervalMs = 60000) => {
    // Immediate first fetch
    getAllRecords().then(records => callback(records));

    // Then poll on interval
    const timer = setInterval(async () => {
        const records = await getAllRecords();
        callback(records);
    }, intervalMs);

    return () => clearInterval(timer);
};
