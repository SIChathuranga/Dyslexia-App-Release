/**
 * Math/Digit Model Service
 *
 * This module provides digit recognition functionality (0-9) by communicating
 * with the Python Flask backend. The backend runs the digits TFLite model for inference.
 * Used for math practice where children draw numbers.
 */
import { getDigitModelInfo, predictDigitFromImage } from '../api/digitApi';
import { checkBackendHealth } from '../api/letterApi';
import { preprocessImageForApi, hasImageContent } from '../utils/imagePreprocess';
// Backend connection status for digit model
let digitBackendConnected = false;
let digitModelInfo = null;
// Class labels for digit recognition
const DIGIT_CLASSES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
/**
 * Initialize connection to the backend and verify digit model is loaded
 */
export const loadMathModel = async () => {
    console.log('Connecting to digit recognition backend...');
    try {
        // Check if backend is healthy (using shared health endpoint)
        const isHealthy = await checkBackendHealth();
        if (!isHealthy) {
            console.warn('Backend server is not reachable for digit model');
            console.warn('Make sure the Python backend is running:');
            console.warn('  cd backend && python run.py');
            digitBackendConnected = false;
            return;
        }
        console.log('Backend connection successful for digit model!');
        // Get digit model information
        digitModelInfo = await getDigitModelInfo();
        if (digitModelInfo) {
            console.log('Digit model info:', digitModelInfo);
            if (digitModelInfo.mode === 'mock') {
                console.warn('Digit backend is running in MOCK MODE');
                console.warn('Digit predictions will be simulated (TensorFlow not installed on backend)');
            }
            else {
                console.log('Digit backend is running with real model inference');
            }
        }
        digitBackendConnected = true;
    }
    catch (error) {
        console.error('Failed to connect to digit backend:', error);
        digitBackendConnected = false;
    }
};
/**
 * Check if the digit backend is connected
 */
export const isDigitBackendConnected = () => {
    return digitBackendConnected;
};
/**
 * Predict digit from a base64 encoded image
 *
 * @param base64Image - Base64 encoded image of the drawing
 * @returns Prediction result with digit, confidence, and alternatives
 */
export const predictDigitFromBase64 = async (base64Image) => {
    if (!digitBackendConnected) {
        console.warn('Digit backend not connected, attempting to reconnect...');
        await loadMathModel();
        if (!digitBackendConnected) {
            console.error('Cannot make digit prediction: Backend not available');
            // Return a fallback random prediction for testing UI flow
            const randomDigit = DIGIT_CLASSES[Math.floor(Math.random() * DIGIT_CLASSES.length)];
            return { digit: randomDigit, confidence: 0.5, topPredictions: [] };
        }
    }
    try {
        // Validate and preprocess image before sending
        const cleanImage = preprocessImageForApi(base64Image);
        if (!hasImageContent(cleanImage)) {
            console.warn('Canvas appears empty for digit prediction');
            return { digit: '?', confidence: 0, topPredictions: [] };
        }
        const result = await predictDigitFromImage(cleanImage);
        return {
            digit: result.label,
            confidence: result.confidence,
            topPredictions: result.top_predictions?.map(p => ({
                label: p.label,
                confidence: p.confidence
            })) || []
        };
    }
    catch (error) {
        console.error('Digit prediction failed:', error);
        // Mark backend as disconnected for retry next time
        digitBackendConnected = false;
        // Return fallback
        const randomDigit = DIGIT_CLASSES[Math.floor(Math.random() * DIGIT_CLASSES.length)];
        return { digit: randomDigit, confidence: 0.5, topPredictions: [] };
    }
};
/**
 * Check if target digit is in predictions (lenient matching for imperfect handwriting)
 *
 * @param target - The target digit the child was asked to draw
 * @param prediction - The prediction result from the model
 * @returns true if target appears in top predictions
 */
export const isDigitInPredictions = (target, prediction) => {
    // Check primary prediction
    if (prediction.digit === target) {
        return true;
    }
    // Check top predictions (lenient matching)
    if (prediction.topPredictions) {
        for (const p of prediction.topPredictions) {
            if (p.label === target) {
                return true;
            }
        }
    }
    return false;
};
/**
 * Legacy function for compatibility with existing code
 *
 * @deprecated Use predictDigitFromBase64 with canvas capture instead
 * @param paths - SVG path strings (not used with backend API)
 */
export const predictEquation = async (paths) => {
    console.warn('predictEquation(paths) is deprecated. Use predictDigitFromBase64 with canvas capture.');
    console.log('Paths received:', paths.length, 'strokes');
    // This function cannot work with the backend API as it expects an image, not paths
    // For now, return a fallback
    if (!digitBackendConnected) {
        await loadMathModel();
    }
    console.log('Please update MathPracticeScreen to use canvas.captureAsBase64()');
    const randomDigit = DIGIT_CLASSES[Math.floor(Math.random() * DIGIT_CLASSES.length)];
    return randomDigit;
};
/**
 * Get current digit model information from the backend
 */
export const getDigitModelInfoCached = () => {
    return digitModelInfo;
};
