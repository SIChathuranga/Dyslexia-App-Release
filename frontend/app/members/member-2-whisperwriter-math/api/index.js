/**
 * ================================================================================
 * API SERVICES — BARREL EXPORT
 * ================================================================================
 *
 * Re-exports all public API functions from the Writing & Math module's
 * backend service layer in one convenient entry point.
 *
 * EXPORTS:
 * --------
 * From letterApi:
 *   - checkBackendHealth()         — Health check for the Flask backend
 *   - getModelInfo()               — Get loaded ML model information
 *   - predictLetterFromImage()     — Basic letter prediction
 *   - predictLetterDyslexiaFriendly() — Dyslexia-friendly letter prediction (recommended)
 *   - getSimilarLetters()          — Get visually similar letters
 *   - getApiBaseUrl() / setApiBaseUrl() — URL management
 *
 * From digitApi:
 *   - predictDigitFromImage()      — Digit (0-9) prediction for math practice
 *   - getDigitModelInfo()          — Get digit model information
 *   - getDigitApiBaseUrl()         — Get digit API base URL
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */

// All letter recognition API functions
export * from './letterApi';

// Digit recognition API functions (named exports to avoid collision with letterApi)
export { predictDigitFromImage, getDigitModelInfo, getDigitApiBaseUrl } from './digitApi';
