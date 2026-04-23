/**
 * ================================================================================
 * LETTER MODEL SERVICE
 * ================================================================================
 *
 * This module provides the frontend service layer for letter recognition.
 * It handles communication with the Python Flask backend and provides
 * a clean interface for the practice screens.
 *
 * ARCHITECTURE:
 * -------------
 *   LetterPracticeScreen
 *       ↓ (calls)
 *   letterModel.ts (this file)
 *       ↓ (HTTP calls)
 *   letterApi.ts
 *       ↓ (network)
 *   Python Backend (Flask + TFLite)
 *
 * KEY FUNCTIONS:
 * --------------
 * - loadLetterModel() - Initialize backend connection
 * - predictLetterFromBase64() - Basic letter prediction
 * - predictLetterDyslexiaFriendlyFromBase64() - Dyslexia-friendly prediction (RECOMMENDED)
 * - isLetterInPredictions() - Check if letter is in top predictions
 *
 * DYSLEXIA-FRIENDLY FEATURES:
 * ---------------------------
 * The dyslexia-friendly prediction considers visually similar letters
 * as acceptable. For example, if a child draws "V" when asked to draw "W",
 * it's accepted because V and W look similar.
 *
 * Similar letter groups:
 * - W, V, U (open bottom)
 * - F, E, T (horizontal lines)
 * - B, D, P, R (bumps/curves)
 * - M, N, W (peaks)
 * - C, G, O, Q (round)
 *
 * USAGE:
 * ------
 *   // Initialize backend connection
 *   await loadLetterModel();
 *
 *   // Capture canvas and predict
 *   const base64 = await canvasRef.current.captureAsBase64();
 *   const result = await predictLetterDyslexiaFriendlyFromBase64(base64, 'A');
 *
 *   // Check result
 *   if (result.shouldAccept) {
 *       showSuccess(result.feedbackMessage);
 *   } else {
 *       showTryAgain(result.feedbackMessage);
 *   }
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import { predictLetterFromImage, predictLetterDyslexiaFriendly, checkBackendHealth, getModelInfo, } from '../api/letterApi';
import { preprocessImageForApi, hasImageContent } from '../utils/imagePreprocess';
// ============================================================================
// MODULE STATE
// ============================================================================
/** Whether we have a successful connection to the backend */
let backendConnected = false;
/** Whether backend currently has real model inference available */
let inferenceReady = false;
/** Cached model information from the backend */
let modelInfo = null;
/** All possible letter classes (for fallback/reference) */
const LETTER_CLASSES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
// ============================================================================
// INITIALIZATION
// ============================================================================
/**
 * Initialize Backend Connection
 * -----------------------------
 * Checks if the backend server is reachable and retrieves model information.
 * Call this when the app starts or when the practice screen mounts.
 *
 * @returns Promise that resolves when connection attempt is complete
 *
 * @example
 *   useEffect(() => {
 *       loadLetterModel();
 *   }, []);
 */
export const loadLetterModel = async () => {
    console.log('Connecting to letter recognition backend...');
    try {
        // Check backend health
        const isHealthy = await checkBackendHealth();
        if (!isHealthy) {
            console.warn('Backend server is not reachable');
            console.warn('Make sure the Python backend is running:');
            console.warn('  cd backend && python run.py');
            backendConnected = false;
            inferenceReady = false;
            return;
        }
        console.log('Backend connection successful!');
        backendConnected = true;
        // Get model information
        modelInfo = await getModelInfo();
        if (modelInfo) {
            console.log('Model info:', modelInfo);
            // Check if running in mock mode (TensorFlow not available)
            if (modelInfo.mode === 'mock') {
                console.warn('Backend is running in MOCK MODE');
                console.warn('Predictions will be simulated (TensorFlow not installed on backend)');
                inferenceReady = false;
                return;
            }
            else {
                console.log('Backend is running with real model inference');
                inferenceReady = true;
            }
        }
        else {
            inferenceReady = false;
        }
    }
    catch (error) {
        console.warn('Failed to connect to backend:', error);
        backendConnected = false;
        inferenceReady = false;
    }
};
/**
 * Check Backend Connection Status
 *
 * @returns true if backend is connected and ready
 */
export const isBackendConnected = () => {
    return backendConnected;
};
/**
 * Check if real inference is available (not mock mode)
 *
 * @returns true if backend is connected and model is in inference mode
 */
export const isInferenceReady = () => {
    return backendConnected && inferenceReady;
};
// ============================================================================
// PREDICTION FUNCTIONS
// ============================================================================
/**
 * Basic Letter Prediction
 * -----------------------
 * Predicts the letter from a base64 image without dyslexia-specific features.
 * For practice screens, use predictLetterDyslexiaFriendlyFromBase64 instead.
 *
 * @param base64Image - Canvas capture as base64 data URL
 * @returns Prediction result with letter, confidence, and alternatives
 *
 * @example
 *   const base64 = await canvasRef.current.captureAsBase64();
 *   const result = await predictLetterFromBase64(base64);
 *   console.log(`Predicted: ${result.letter}`);
 */
export const predictLetterFromBase64 = async (base64Image) => {
    // Ensure backend is connected
    if (!backendConnected) {
        console.warn('Backend not connected, attempting to reconnect...');
        await loadLetterModel();
        if (!backendConnected) {
            console.warn('Cannot make prediction: Backend not available');
            throw new Error('Backend not available for real inference');
        }
    }
    if (!inferenceReady) {
        throw new Error('Backend is in mock mode. Real inference is not active.');
    }
    try {
        // Validate and preprocess image before sending
        const cleanImage = preprocessImageForApi(base64Image);
        if (!hasImageContent(cleanImage)) {
            throw new Error('Canvas appears empty — please draw a letter first');
        }
        // Call backend API
        const result = await predictLetterFromImage(cleanImage);
        if (result.mock) {
            inferenceReady = false;
            throw new Error('Backend returned mock prediction. Real inference is not active.');
        }
        return {
            letter: result.label,
            confidence: result.confidence,
            topPredictions: result.top_predictions || []
        };
    }
    catch (error) {
        console.warn('Prediction failed:', error);
        // Mark disconnected for retry
        if (error instanceof Error && error.message.toLowerCase().includes('mock')) {
            inferenceReady = false;
        }
        else {
            backendConnected = false;
            inferenceReady = false;
        }
        throw error;
    }
};
/**
 * Dyslexia-Friendly Letter Prediction (RECOMMENDED)
 * -------------------------------------------------
 * Predicts the letter with dyslexia-friendly matching enabled.
 * This is the recommended function for practice screens.
 *
 * KEY BEHAVIOR:
 * - Accepts visually similar letters (W/V, F/E, B/D, etc.)
 * - Provides encouraging feedback messages
 * - Returns shouldAccept=true if the attempt is good enough
 *
 * @param base64Image - Canvas capture as base64 data URL
 * @param expectedLetter - The letter the child was asked to draw
 * @returns Enhanced prediction with similarity analysis and feedback
 *
 * @example
 *   const base64 = await canvasRef.current.captureAsBase64();
 *   const result = await predictLetterDyslexiaFriendlyFromBase64(base64, 'W');
 *
 *   if (result.shouldAccept) {
 *       // Show success feedback
 *       showFeedback(result.feedbackMessage, 'success');
 *   } else {
 *       // Encourage to try again
 *       showFeedback(result.feedbackMessage, 'error');
 *   }
 */
export const predictLetterDyslexiaFriendlyFromBase64 = async (base64Image, expectedLetter) => {
    // Ensure backend is connected
    if (!backendConnected) {
        console.warn('Backend not connected, attempting to reconnect...');
        await loadLetterModel();
        if (!backendConnected) {
            const isMockMode = modelInfo?.mode === 'mock';
            const feedbackMessage = isMockMode
                ? 'Backend connected, but model is in MOCK mode. Run backend with Python 3.11/3.12 for real inference.'
                : 'Connection error. Please try again.';
            console.warn(isMockMode
                ? 'Cannot make prediction: backend is in mock mode'
                : 'Cannot make prediction: backend not available');
            // Return error fallback
            return {
                letter: expectedLetter,
                confidence: 0.5,
                topPredictions: [],
                dyslexiaFriendly: false,
                expectedLetter: expectedLetter,
                isExactMatch: false,
                isSimilarLetter: false,
                similarLetters: [],
                shouldAccept: false,
                adjustedConfidence: 0,
                feedbackLevel: 'try_again',
                feedbackMessage
            };
        }
    }
    if (!inferenceReady) {
        return {
            letter: expectedLetter,
            confidence: 0.5,
            topPredictions: [],
            dyslexiaFriendly: false,
            expectedLetter: expectedLetter,
            isExactMatch: false,
            isSimilarLetter: false,
            similarLetters: [],
            shouldAccept: false,
            adjustedConfidence: 0,
            feedbackLevel: 'try_again',
            feedbackMessage: 'Backend connected, but model is in MOCK mode. Run backend with Python 3.11/3.12 for real inference.'
        };
    }
    try {
        // Validate and preprocess image before sending
        const cleanImage = preprocessImageForApi(base64Image);
        if (!hasImageContent(cleanImage)) {
            return {
                letter: expectedLetter,
                confidence: 0,
                dyslexiaFriendly: false,
                expectedLetter: expectedLetter,
                isExactMatch: false,
                isSimilarLetter: false,
                similarLetters: [],
                shouldAccept: false,
                adjustedConfidence: 0,
                feedbackLevel: 'try_again',
                feedbackMessage: 'Canvas appears empty — please draw a letter first'
            };
        }
        // Call backend API with dyslexia-friendly endpoint
        const result = await predictLetterDyslexiaFriendly(cleanImage, expectedLetter);
        if (result.mock) {
            inferenceReady = false;
            throw new Error('Backend returned mock prediction. Real inference is not active.');
        }
        // Map backend response to frontend interface
        return {
            letter: result.label,
            confidence: result.confidence,
            topPredictions: result.top_predictions || [],
            dyslexiaFriendly: result.dyslexia_friendly,
            expectedLetter: result.expected_letter,
            isExactMatch: result.is_exact_match || false,
            isSimilarLetter: result.is_similar_letter || false,
            similarLetters: result.similar_letters || [],
            shouldAccept: result.should_accept || false,
            adjustedConfidence: result.adjusted_confidence || result.confidence,
            feedbackLevel: result.feedback_level || 'try_again',
            feedbackMessage: result.feedback_message || 'Keep trying!'
        };
    }
    catch (error) {
        console.warn('Dyslexia-friendly prediction failed:', error);
        if (error instanceof Error && error.message.toLowerCase().includes('mock')) {
            inferenceReady = false;
        }
        else {
            backendConnected = false;
            inferenceReady = false;
        }
        // Return error fallback
        return {
            letter: expectedLetter,
            confidence: 0,
            dyslexiaFriendly: false,
            expectedLetter: expectedLetter,
            isExactMatch: false,
            isSimilarLetter: false,
            similarLetters: [],
            shouldAccept: false,
            adjustedConfidence: 0,
            feedbackLevel: 'try_again',
            feedbackMessage: 'Connection error. Please try again.'
        };
    }
};
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
/**
 * Check if Target Letter is in Predictions
 * ----------------------------------------
 * Helper function for lenient matching with imperfect handwriting.
 * Checks if the target letter appears in the top predictions.
 *
 * @param target - The letter the child was asked to draw
 * @param prediction - The prediction result from predictLetterFromBase64
 * @returns true if target appears in primary or top predictions
 *
 * @example
 *   const result = await predictLetterFromBase64(base64);
 *   if (isLetterInPredictions('A', result)) {
 *       // The target letter was recognized
 *   }
 */
export const isLetterInPredictions = (target, prediction) => {
    const targetUpper = target.toUpperCase();
    // Check primary prediction
    if (prediction.letter.toUpperCase() === targetUpper) {
        return true;
    }
    // Check alternative predictions (lenient matching)
    if (prediction.topPredictions) {
        for (const p of prediction.topPredictions) {
            if (p.label.toUpperCase() === targetUpper) {
                return true;
            }
        }
    }
    return false;
};
/**
 * Legacy Prediction Function
 * --------------------------
 * @deprecated Use predictLetterFromBase64 with canvas.captureAsBase64() instead
 *
 * This function was used with SVG paths but is no longer supported.
 * The backend requires a base64 image, not SVG paths.
 *
 * @param paths - SVG path strings (not used)
 * @returns Fallback prediction
 */
export const predictLetter = async (paths) => {
    console.warn('predictLetter(paths) is deprecated. Use predictLetterFromBase64 with canvas capture.');
    console.log('Paths received:', paths.length, 'strokes');
    // Attempt to connect if not already
    if (!backendConnected) {
        await loadLetterModel();
    }
    // Return fallback - update your code to use captureAsBase64
    console.log('Please update your code to use canvas.captureAsBase64()');
    const randomLetter = LETTER_CLASSES[Math.floor(Math.random() * LETTER_CLASSES.length)];
    return { letter: randomLetter, confidence: 0.5 };
};
/**
 * Get Model Information
 *
 * @returns Cached model info from the backend (or null if not loaded)
 */
export const getLetterModelInfo = () => {
    return modelInfo;
};
