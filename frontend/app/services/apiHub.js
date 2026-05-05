/**
 * ================================================================================
 * API HUB - Centralized Backend Connection Configuration
 * ================================================================================
 *
 * This file manages connections to multiple backend services hosted on
 * separate Render platforms. Each component has its own dedicated backend.
 *
 * BACKENDS:
 * ---------
 * 1. Photo-Based Spelling Challenge Backend (Port 9000)
 *    - Object detection (YOLOv8)
 *    - Speech-to-text (Whisper)
 *    - Answer verification
 *    - Auth & progress tracking
 *
 * 2. Writing & Math Real-Time Feedback Backend (Port 5000)
 *    - Letter recognition (TFLite ML model)
 *    - Digit recognition (TFLite ML model)
 *    - Dyslexia-friendly prediction
 *    - Session & progress tracking
 *
 * 3. Multi-Skill Learning Game Backend (Port 5001)
 *    - Dyslexia prediction (session-based ML model)
 *    - Progress tracking & diagnosis reports
 *    - Game session analytics
 *
 * USAGE:
 * ------
 *   import { API_BACKENDS, getBackendUrl } from '../services/apiHub';
 *
 *   // Get a specific backend URL
 *   const photoUrl = getBackendUrl('photoSpelling');
 *   const writingUrl = getBackendUrl('writingMath');
 *
 * CONFIGURATION:
 * --------------
 * Set environment variables to override default URLs:
 *   EXPO_PUBLIC_PHOTO_SPELLING_API_URL  - Photo-Based Spelling backend
 *   EXPO_PUBLIC_WRITING_MATH_API_URL    - Writing & Math Feedback backend
 *   EXPO_PUBLIC_MULTI_SKILL_API_URL     - Multi-Skill Learning Game backend
 *
 * For Render deployment, set these to your Render service URLs:
 *   e.g., https://photo-spelling-api.onrender.com
 *   e.g., https://writing-math-api.onrender.com
 *   e.g., https://multi-skill-api.onrender.com
 *
 * ================================================================================
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ============================================================================
// DEFAULT PORT CONFIGURATION
// ============================================================================

const PHOTO_SPELLING_PORT = '9000'; // FastAPI backend
const WRITING_MATH_PORT = '5000';   // Flask backend
const MULTI_SKILL_PORT = '5001';    // Flask backend (Multi-Skill Learning Game)
const ACTIONS_PORT = '8000';        // Action detection backend

// ============================================================================
// HOST RESOLUTION
// ============================================================================

/**
 * Resolve the development host from Expo constants.
 * Used when no environment variable is set (local development).
 */
const resolveDevHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  const host = hostUri?.split(':')?.[0];
  if (host) return host;

  return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
};

// ============================================================================
// BACKEND CONFIGURATION
// ============================================================================

/**
 * Backend service definitions.
 * Each backend can be overridden via environment variables for production
 * (Render deployment) or will fall back to local development URLs.
 */
const API_BACKENDS = {
  /**
   * Photo-Based Spelling Challenge Backend
   * Handles: object detection, speech-to-text, answer verification, auth, progress
   */
  photoSpelling: {
    name: 'Photo-Based Spelling Challenge',
    envKey: 'EXPO_PUBLIC_PHOTO_SPELLING_API_URL',
    defaultPort: PHOTO_SPELLING_PORT,
    endpoints: {
      detectObject: '/detect-object',
      speechToText: '/speech-to-text',
      verifyAnswer: '/verify-answer',
      authRegister: '/auth/register',
      authLogin: '/auth/login',
      authMe: '/auth/me',
      authLogout: '/auth/logout',
      progressAttempt: '/progress/attempt',
      progressImport: '/progress/import',
      progressStats: '/progress/stats',
    },
  },

  /**
   * Writing & Math Real-Time Feedback Backend
   * Handles: letter recognition, digit recognition, dyslexia-friendly prediction
   */
  writingMath: {
    name: 'Writing & Math Real-Time Feedback',
    envKey: 'EXPO_PUBLIC_WRITING_MATH_API_URL',
    defaultPort: WRITING_MATH_PORT,
    endpoints: {
      health: '/health',
      letterInfo: '/api/letter/info',
      letterPredict: '/api/letter/predict',
      letterPredictDyslexia: '/api/letter/predict-dyslexia',
      letterSimilar: '/api/letter/similar-letters',
      digitInfo: '/api/digit/info',
      digitPredict: '/api/digit/predict',
      dataAttempts: '/api/data/attempts',
      dataSessions: '/api/data/sessions',
      dataSummary: '/api/data/summary',
      dataSync: '/api/data/sync',
    },
  },

  /**
   * Multi-Skill Learning Game Backend
   * Handles: dyslexia prediction, progress tracking, game session analytics
   */
  multiSkill: {
    name: 'Multi-Skill Learning Game',
    envKey: 'EXPO_PUBLIC_MULTI_SKILL_API_URL',
    defaultPort: MULTI_SKILL_PORT,
    endpoints: {
      health: '/health',
      predict: '/predict',
      predictBatch: '/predict/batch',
      progress: '/progress',
      history: '/history',
      users: '/users',
    },
  },

  /**
   * Actions / Cognitive Assessment Backend
   * Handles: action detection inference, assessment history tracking
   */
  actions: {
    name: 'Actions / Cognitive Assessment',
    envKey: 'EXPO_PUBLIC_ACTION_DETECTION_API_URL',
    defaultPort: ACTIONS_PORT,
    endpoints: {
      predict: '/predict',
      health: '/health',
      assessmentHistorySave: '/assessment-history/save',
      assessmentHistoryList: '/assessment-history/list',
    },
  },
};

// ============================================================================
// URL RESOLUTION
// ============================================================================

/**
 * Get the base URL for a specific backend service.
 *
 * Priority:
 * 1. Environment variable (for Render / production deployment)
 * 2. Local development URL (auto-detected host + default port)
 *
 * @param {string} backendKey - 'photoSpelling', 'writingMath', 'multiSkill', or 'actions'
 * @returns {string} The base URL for the backend
 */
const getBackendUrl = (backendKey) => {
  const backend = API_BACKENDS[backendKey];
  if (!backend) {
    throw new Error(`Unknown backend key: ${backendKey}`);
  }

  // Check for environment variable override (Render deployment)
  // In Expo, EXPO_PUBLIC_* variables are embedded at build time
  try {
    const envUrl = process.env[backend.envKey];
    if (envUrl && envUrl.length > 0) {
      console.log(`[API] Using backend URL from env for ${backendKey}: ${envUrl}`);
      return envUrl.replace(/\/+$/, ''); // strip trailing slash
    }
  } catch (e) {
    console.warn(`[API] Could not access environment variable ${backend.envKey}:`, e.message);
  }

  // Fall back to local development URL
  const host = resolveDevHost();
  const fallbackUrl = `http://${host}:${backend.defaultPort}`;
  console.log(`[API] Using fallback URL for ${backendKey}: ${fallbackUrl}`);
  return fallbackUrl;
};

/**
 * Get all backend URLs as a convenient object.
 * @returns {{ photoSpelling: string, writingMath: string, multiSkill: string, actions: string }}
 */
const getAllBackendUrls = () => ({
  photoSpelling: getBackendUrl('photoSpelling'),
  writingMath: getBackendUrl('writingMath'),
  multiSkill: getBackendUrl('multiSkill'),
  actions: getBackendUrl('actions'),
});

// ============================================================================
// EXPORTS
// ============================================================================

export {
  API_BACKENDS,
  getBackendUrl,
  getAllBackendUrls,
  PHOTO_SPELLING_PORT,
  WRITING_MATH_PORT,
  MULTI_SKILL_PORT,
  ACTIONS_PORT,
};
