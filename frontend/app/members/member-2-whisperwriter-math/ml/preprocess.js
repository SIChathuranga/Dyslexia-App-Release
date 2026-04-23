import * as tf from '@tensorflow/tfjs';
/**
 * Preprocess the drawing paths into a tensor ready for the model.
 * Extracts features from SVG path data.
 */
export const preprocessDrawing = async (paths) => {
    console.log('Preprocessing paths:', paths.length);
    if (paths.length === 0) {
        console.warn('No paths provided, returning zero tensor');
        return tf.tensor2d([[0]], [1, 1]);
    }
    // Extract stroke length as a simple feature
    let totalLength = 0;
    paths.forEach(path => {
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
    // Normalize the feature
    const normalizedFeature = Math.min(totalLength / 1000, 1);
    console.log('Normalized feature:', normalizedFeature.toFixed(4));
    // Return tensor with shape [1, 1] matching model input
    return tf.tensor2d([[normalizedFeature]], [1, 1]);
};
/**
 * Load a TensorFlow.js model from bundled assets
 */
export const loadModel = async (modelJson, modelWeights) => {
    try {
        await tf.ready();
        console.log('TensorFlow.js ready. Backend:', tf.getBackend());
        // Note: bundleResourceIO is needed for React Native
        // For now, return null as we need proper setup
        console.warn('Model loading requires bundleResourceIO setup');
        return null;
    }
    catch (err) {
        console.error("Error loading model:", err);
        return null;
    }
};
