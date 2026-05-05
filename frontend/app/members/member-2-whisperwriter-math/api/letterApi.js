/**
 * ================================================================================
 * LETTER RECOGNITION API SERVICE
 * ================================================================================
 *
 * This module handles all HTTP communication with the Python Flask backend
 * for letter recognition and dyslexia-friendly prediction.
 *
 * BACKEND ENDPOINTS USED:
 * -----------------------
 * GET  /health                    - Health check
 * GET  /api/letter/info           - Model information
 * POST /api/letter/predict        - Basic letter prediction
 * POST /api/letter/predict-dyslexia - Dyslexia-friendly prediction
 * GET  /api/letter/similar-letters/<L> - Get similar letters
 *
 * CONFIGURATION:
 * --------------
 * Update API_BASE_URL to match your backend server:
 * - Android Emulator: 'http://10.0.2.2:5000'
 * - iOS Simulator: 'http://localhost:5000'
 * - Physical Device: 'http://<your-computer-ip>:5000'
 *
 * Find your IP: 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
 *
 * USAGE:
 * ------
 *   // Check if backend is reachable
 *   const isHealthy = await checkBackendHealth();
 *
 *   // Get model info
 *   const info = await getModelInfo();
 *
 *   // Predict letter (basic)
 *   const result = await predictLetterFromImage(base64Image);
 *
 *   // Predict letter (dyslexia-friendly) - RECOMMENDED
 *   const result = await predictLetterDyslexiaFriendly(base64Image, 'A');
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import { getApiBaseUrl as getResolvedApiBaseUrl, getApiBaseUrlCandidates, setApiBaseUrl as setResolvedApiBaseUrl } from './apiBaseUrl';
// ============================================================================
// HEALTH CHECK
// ============================================================================
/**
 * Check if the backend server is healthy and reachable
 *
 * Use this to verify connectivity before making predictions.
 * Shows connection status indicator in the UI.
 *
 * @returns true if backend is healthy, false otherwise
 *
 * @example
 *   const isHealthy = await checkBackendHealth();
 *   if (!isHealthy) {
 *       console.warn('Backend not reachable!');
 *   }
 */
export const checkBackendHealth = async () => {
    const candidates = getApiBaseUrlCandidates();
    for (const baseUrl of candidates) {
        try {
            const response = await fetch(`${baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });
            if (!response.ok) {
                continue;
            }
            const data = await response.json();
            if (data.status === 'healthy') {
                setResolvedApiBaseUrl(baseUrl);
                console.log('Backend health check passed:', baseUrl);
                return true;
            }
        }
        catch {
            // Try the next candidate base URL.
        }
    }
    console.warn('Backend health check failed for all candidates:', candidates);
    return false;
};
// ============================================================================
// MODEL INFORMATION
// ============================================================================
/**
 * Get information about the loaded ML model
 *
 * Useful for debugging and checking if real inference or mock mode is active.
 *
 * @returns Model info object or null if failed
 *
 * @example
 *   const info = await getModelInfo();
 *   if (info?.mode === 'mock') {
 *       console.warn('Using mock predictions');
 *   }
 */
export const getModelInfo = async () => {
    try {
        const response = await fetch(`${getResolvedApiBaseUrl()}/api/letter/info`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                return result.data;
            }
        }
        return null;
    }
    catch (error) {
        console.warn('Failed to get model info:', error);
        return null;
    }
};
// ============================================================================
// PREDICTION ENDPOINTS
// ============================================================================
/**
 * Basic Letter Prediction
 * -----------------------
 * Send a base64 encoded image to the backend for letter prediction.
 * Returns raw prediction without dyslexia-friendly processing.
 *
 * For practice screens, use predictLetterDyslexiaFriendly instead.
 *
 * @param base64Image - Base64 encoded PNG image (with or without "data:image/png;base64," prefix)
 * @returns Prediction result with label, confidence, and alternatives
 * @throws Error if prediction fails
 *
 * @example
 *   const base64 = await canvasRef.current.captureAsBase64();
 *   const result = await predictLetterFromImage(base64);
 *   console.log(`Predicted: ${result.label} (${result.confidence})`);
 */
export const predictLetterFromImage = async (base64Image) => {
    try {
        console.log('Sending image to backend for prediction...');
        console.log('Image data length:', base64Image.length);
        const response = await fetch(`${getResolvedApiBaseUrl()}/api/letter/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.warn('Backend error response:', errorText);
            throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        if (result.success && result.data) {
            console.log('Prediction received:', result.data);
            return result.data;
        }
        else {
            throw new Error(result.error || 'Unknown prediction error');
        }
    }
    catch (error) {
        console.warn('Prediction API error:', error);
        throw error;
    }
};
/**
 * Dyslexia-Friendly Letter Prediction (RECOMMENDED)
 * ------------------------------------------------
 * Send a base64 encoded image for prediction with dyslexia-friendly matching.
 *
 * This endpoint considers visually similar letters (W/V, F/E, B/D, etc.)
 * as acceptable when the expected letter is provided.
 *
 * SIMILARITY GROUPS:
 * - W, V, U (open bottom letters)
 * - F, E, T (horizontal line letters)
 * - B, D, P, R (letters with bumps)
 * - M, N, W (multi-stroke peaks)
 * - C, G, O, Q (round letters)
 *
 * @param base64Image - Base64 encoded PNG image
 * @param expectedLetter - The letter the child was asked to draw (e.g., "A")
 * @returns Enhanced prediction with similarity analysis and feedback
 * @throws Error if prediction fails
 *
 * @example
 *   const base64 = await canvasRef.current.captureAsBase64();
 *   const result = await predictLetterDyslexiaFriendly(base64, 'W');
 *
 *   if (result.should_accept) {
 *       showSuccess(result.feedback_message);
 *   } else {
 *       showTryAgain(result.feedback_message);
 *   }
 */
export const predictLetterDyslexiaFriendly = async (base64Image, expectedLetter) => {
    try {
        console.log('Sending image to backend for dyslexia-friendly prediction...');
        console.log('Expected letter:', expectedLetter || 'not specified');
        console.log('Image data length:', base64Image.length);
        const response = await fetch(`${getResolvedApiBaseUrl()}/api/letter/predict-dyslexia`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image,
                expected_letter: expectedLetter,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.warn('Backend error response:', errorText);
            throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        if (result.success && result.data) {
            console.log('Dyslexia-friendly prediction received:', result.data);
            return result.data;
        }
        else {
            throw new Error(result.error || 'Unknown prediction error');
        }
    }
    catch (error) {
        console.warn('Dyslexia-friendly prediction API error:', error);
        throw error;
    }
};
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Get Similar Letters
 * ------------------
 * Get all letters that are visually similar to the given letter.
 * These are letters commonly confused by dyslexic children.
 *
 * @param letter - The letter to find similar letters for
 * @returns Array of similar letters (includes the input letter)
 *
 * @example
 *   const similar = await getSimilarLetters('W');
 *   // Returns: ['W', 'V', 'U', 'M', 'N']
 */
export const getSimilarLetters = async (letter) => {
    try {
        const response = await fetch(`${getResolvedApiBaseUrl()}/api/letter/similar-letters/${letter.toUpperCase()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                return result.data.similar_letters;
            }
        }
        // Fallback: return just the letter
        return [letter.toUpperCase()];
    }
    catch (error) {
        console.error('Failed to get similar letters:', error);
        return [letter.toUpperCase()];
    }
};
/**
 * Get the current API base URL
 *
 * @returns Current API base URL string
 */
export const getApiBaseUrl = () => {
    return getResolvedApiBaseUrl();
};
/**
 * Note about updating API URL
 *
 * To change the API URL, update the API_BASE_URL constant at the top of this file.
 * Dynamic URL changes are not currently supported to prevent configuration errors.
 *
 * @param url - The URL that was requested (logged for debugging)
 */
export const setApiBaseUrl = (url) => {
    setResolvedApiBaseUrl(url);
    console.log('API URL updated to:', getResolvedApiBaseUrl());
};
