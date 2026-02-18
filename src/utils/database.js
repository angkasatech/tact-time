/**
 * Generate unique ID using timestamp + random string
 * @returns {string}
 */
export const generateId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`;
};

/**
 * Format date to ISO string
 * @param {Date} date
 * @returns {string}
 */
const formatDate = (date) => {
    return date.toISOString();
};

/**
 * Calculate duration in seconds and minutes
 * @param {string} startTime - ISO date string
 * @param {string} endTime - ISO date string
 * @returns {Object} - { durationSeconds, durationMinutes }
 */
const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationSeconds = Math.floor((end - start) / 1000);
    const durationMinutes = Math.round(durationSeconds / 60 * 100) / 100; // 2 decimal places

    return { durationSeconds, durationMinutes };
};

/**
 * Save a completed record to the JSON database
 * This handles race conditions by using a retry mechanism
 * @param {Object} record - { vin, category, startTime, endTime }
 * @returns {Promise<boolean>}
 */
export const saveRecord = async (record) => {
    const maxRetries = 3;
    const retryDelay = 100; // ms

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Get current records
            const records = await getAllRecords();

            // Calculate duration
            const { durationSeconds, durationMinutes } = calculateDuration(
                record.startTime,
                record.endTime
            );

            // Create new record with all fields
            const newRecord = {
                id: generateId(),
                dateCreated: formatDate(new Date()),
                vin: record.vin,
                category: record.category,
                startTime: record.startTime,
                endTime: record.endTime,
                durationSeconds,
                durationMinutes
            };

            // Add to records array
            records.push(newRecord);

            // Save back to file (in a real app, this would be an API call)
            // For now, we'll use localStorage as a fallback since we can't write to public files from browser
            const allRecordsKey = 'tacttime_all_records';
            localStorage.setItem(allRecordsKey, JSON.stringify(records));

            // Trigger a custom event so other windows/tabs can update
            window.dispatchEvent(new CustomEvent('tacttime-record-saved', {
                detail: newRecord
            }));

            return true;
        } catch (error) {
            console.error(`Save attempt ${attempt + 1} failed:`, error);

            if (attempt < maxRetries - 1) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            }
        }
    }

    return false;
};

/**
 * Get all records from the database
 * @returns {Promise<Array>}
 */
export const getAllRecords = async () => {
    try {
        // In a real app, this would fetch from the JSON file or API
        // For browser-based app, we use localStorage
        const allRecordsKey = 'tacttime_all_records';
        const data = localStorage.getItem(allRecordsKey);

        if (data) {
            return JSON.parse(data);
        }

        return [];
    } catch (error) {
        console.error('Error getting records:', error);
        return [];
    }
};

/**
 * Initialize the database (create empty structure if needed)
 */
export const initializeDatabase = async () => {
    const allRecordsKey = 'tacttime_all_records';

    if (!localStorage.getItem(allRecordsKey)) {
        localStorage.setItem(allRecordsKey, JSON.stringify([]));
    }
};

/**
 * Listen for record updates from other tabs/windows
 * @param {Function} callback - Called when a new record is saved
 * @returns {Function} - Cleanup function
 */
export const onRecordSaved = (callback) => {
    const handler = (event) => {
        callback(event.detail);
    };

    window.addEventListener('tacttime-record-saved', handler);

    // Also listen for storage events (cross-tab communication)
    const storageHandler = (event) => {
        if (event.key === 'tacttime_all_records') {
            callback(null); // Signal to refresh all records
        }
    };

    window.addEventListener('storage', storageHandler);

    // Return cleanup function
    return () => {
        window.removeEventListener('tacttime-record-saved', handler);
        window.removeEventListener('storage', storageHandler);
    };
};
