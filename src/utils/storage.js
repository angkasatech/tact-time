// LocalStorage keys
const ACTIVE_RECORDING_KEY = 'tacttime_active_recording';
const PAUSE_STATE_PREFIX = 'tacttime_pause_state_';

/**
 * Save active recording to localStorage
 * @param {Object} recording - { vin, category, startTime }
 */
export const saveActiveRecording = (recording) => {
  try {
    localStorage.setItem(ACTIVE_RECORDING_KEY, JSON.stringify(recording));
    return true;
  } catch (error) {
    console.error('Error saving active recording:', error);
    return false;
  }
};

/**
 * Get active recording from localStorage
 * @returns {Object|null} - Recording object or null
 */
export const getActiveRecording = () => {
  try {
    const data = localStorage.getItem(ACTIVE_RECORDING_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting active recording:', error);
    return null;
  }
};

/**
 * Clear active recording from localStorage
 */
export const clearActiveRecording = () => {
  try {
    localStorage.removeItem(ACTIVE_RECORDING_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing active recording:', error);
    return false;
  }
};

/**
 * Clear all pause state keys from localStorage.
 * Call this before starting a new recording to prevent a stale
 * pause state from a previous session leaking in.
 */
export const clearPauseState = () => {
  try {
    // Remove any scoped pause state keys (tacttime_pause_state_<startTime>)
    Object.keys(localStorage)
      .filter(k => k.startsWith(PAUSE_STATE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
    return true;
  } catch (error) {
    console.error('Error clearing pause state:', error);
    return false;
  }
};

/**
 * Check if there's an active recording
 * @returns {boolean}
 */
export const hasActiveRecording = () => {
  return getActiveRecording() !== null;
};
