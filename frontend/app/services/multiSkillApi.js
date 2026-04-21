/**
 * ================================================================================
 * MULTI-SKILL LEARNING GAME API SERVICE
 * ================================================================================
 *
 * API client for the Multi-Skill Learning Game backend.
 * Backend: Flask on port 5001 (Render Account 3)
 *
 * Endpoints:
 *   GET  /health            - Backend health check
 *   POST /predict           - Submit session data for dyslexia prediction
 *   POST /predict/batch     - Predict from last N sessions (aggregate)
 *   GET  /progress/:userId  - Get user progress/diagnosis report
 *   GET  /history/:userId   - Get raw session history
 *   GET  /users             - List all users
 *
 * ================================================================================
 */

import { getBackendUrl } from './apiHub';

const getBaseUrl = () => getBackendUrl('multiSkill');

// Render free tier can take up to 60s to wake from sleep
const FETCH_TIMEOUT_MS = 90000;

/**
 * Wrapper around fetch with timeout support for Render cold starts.
 */
const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The backend may be waking up — please try again.');
    }
    throw error;
  }
};

/**
 * Check backend health status.
 * @returns {Promise<Object>} Health status including model, DB, and heartbeat state
 */
export const checkHealth = async () => {
  const baseUrl = getBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/health`);
  return await response.json();
};

/**
 * Submit a single game session for dyslexia stage prediction.
 * Results are stored in MongoDB (sec_3_sessions collection).
 *
 * @param {Object} sessionData - Session metrics including user_id and 20 feature fields
 * @returns {Promise<Object>} Prediction result with stage, probabilities, recommendation
 */
export const predictSession = async (sessionData) => {
  const baseUrl = getBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

/**
 * Predict dyslexia stage from the last N sessions (aggregated average).
 *
 * @param {string} userId - User identifier
 * @param {number} [lastN=5] - Number of recent sessions to aggregate
 * @returns {Promise<Object>} Aggregated prediction result
 */
export const predictBatch = async (userId, lastN = 5) => {
  const baseUrl = getBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/predict/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, last_n: lastN }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

/**
 * Get full progress report for a user.
 * Includes stage history, trend analysis, and per-metric improvement.
 *
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} Progress report with trends and recommendations
 */
export const getProgress = async (userId) => {
  const baseUrl = getBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/progress/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

/**
 * Get raw session history for a user.
 *
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} List of all sessions with features and predictions
 */
export const getHistory = async (userId) => {
  const baseUrl = getBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/history/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

/**
 * List all users who have session data in the database.
 *
 * @returns {Promise<Object>} List of users with session counts
 */
export const getUsers = async () => {
  const baseUrl = getBaseUrl();
  const response = await fetchWithTimeout(`${baseUrl}/users`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};
