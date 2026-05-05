/**
 * ================================================================================
 * DRAWING PREPROCESSING — TensorFlow.js (Legacy)
 * ================================================================================
 *
 * Legacy preprocessing module for converting SVG drawing paths into tensors
 * that can be fed to an on-device TensorFlow.js model.
 *
 * STATUS: DEPRECATED / NOT IN ACTIVE USE
 * ----------------------------------------
 * The app now uses a backend-based approach (Flask + TFLite) instead of
 * running TF.js on-device. This module is retained for reference only.
 *
 * REPLACED BY:
 * - `DrawingCanvas.captureAsBase64()` — captures the canvas as an image
 * - `letterApi.predictLetterFromImage()` — sends image to the Flask backend
 * - `digitApi.predictDigitFromImage()` — sends digit image to the Flask backend
 *
 * HOW THE LEGACY APPROACH WORKED:
 * --------------------------------
 * 1. SVG paths were parsed to extract stroke coordinates
 * 2. Total stroke length was computed as a simple feature
 * 3. The feature was normalized to [0, 1]
 * 4. A TF.js model predicted from the tensor
 *
 * WHY IT WAS REPLACED:
 * --------------------
 * - A single stroke-length feature is too limited for letter classification
 * - TF.js on React Native requires `bundleResourceIO` setup (complex)
 * - Backend inference provides much higher accuracy with full EMNIST models
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import * as tf from '@tensorflow/tfjs';

/**
 * Preprocess SVG drawing paths into a 1D tensor for on-device inference.
 *
 * @deprecated Use canvas.captureAsBase64() + backend API instead.
 *
 * Extracts total stroke length as a normalized feature from SVG path data.
 * Only handles M (moveTo) and L (lineTo) commands — quadratic curves are ignored.
 *
 * @param paths - Array of SVG path strings (e.g. ["M10,10 L20,30", ...])
 * @returns TensorFlow.js tensor of shape [1, 1]
 */
export const preprocessDrawing = async (paths) => {
    console.log('Preprocessing paths:', paths.length);

    if (paths.length === 0) {
        console.warn('No paths provided, returning zero tensor');
        return tf.tensor2d([[0]], [1, 1]);
    }

    // Extract total Euclidean stroke length as a simple feature
    let totalLength = 0;
    paths.forEach(path => {
        // Match only M (moveTo) and L (lineTo) commands — ignores Q curves
        const commands = path.match(/[ML][0-9.-]+,[0-9.-]+/g) || [];
        let prevX = 0, prevY = 0;

        commands.forEach((cmd, index) => {
            const coords = cmd.substring(1).split(',');
            const x = parseFloat(coords[0]);
            const y = parseFloat(coords[1]);

            if (index > 0) {
                const dx = x - prevX;
                const dy = y - prevY;
                totalLength += Math.sqrt(dx * dx + dy * dy);
            }

            prevX = x;
            prevY = y;
        });
    });

    // Normalize feature to [0, 1] — 1000px total stroke length = 1.0
    const normalizedFeature = Math.min(totalLength / 1000, 1);
    console.log('Normalized feature:', normalizedFeature.toFixed(4));

    // Return a [1, 1] shaped tensor matching the expected model input
    return tf.tensor2d([[normalizedFeature]], [1, 1]);
};

/**
 * Load a TensorFlow.js model from bundled app assets.
 *
 * @deprecated Backend TFLite inference is used instead.
 *
 * Requires `bundleResourceIO` from `@tensorflow/tfjs-react-native` to load
 * models bundled with the app. This setup was not completed due to complexity.
 *
 * @param modelJson    - Bundled model.json asset (require())
 * @param modelWeights - Bundled weights binary asset (require())
 * @returns null (model loading is not implemented)
 */
export const loadModel = async (modelJson, modelWeights) => {
    try {
        await tf.ready();
        console.log('TensorFlow.js ready. Backend:', tf.getBackend());

        // Note: bundleResourceIO is needed for React Native asset loading
        // This requires additional setup that was replaced by backend inference
        console.warn('Model loading requires bundleResourceIO setup');
        return null;
    } catch (err) {
        console.error("Error loading model:", err);
        return null;
    }
};
