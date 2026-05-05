const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add .bin extension for TensorFlow.js model weight files
// Add .tflite extension for TFLite model files
config.resolver.assetExts.push('bin', 'tflite');

module.exports = config;
