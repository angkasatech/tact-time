/**
 * Format elapsed time from milliseconds to HH:MM:SS
 * @param {number} milliseconds
 * @returns {string}
 */
export const formatElapsedTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Calculate elapsed time from start time to now
 * @param {string} startTime - ISO date string
 * @returns {number} - Milliseconds
 */
export const getElapsedTime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    return now - start;
};

/**
 * Format duration in minutes to readable string
 * @param {number} minutes
 * @returns {string}
 */
export const formatDurationMinutes = (minutes) => {
    if (minutes < 1) {
        return `${Math.round(minutes * 60)}s`;
    }

    if (minutes < 60) {
        return `${minutes.toFixed(1)} min`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
};
