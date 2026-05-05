import { getBackendUrl } from '../../../services/apiHub';
import { Platform } from 'react-native';

let FileSystem = null;
try {
  FileSystem = require('expo-file-system');
} catch (e) {
  console.warn('[modelService] FileSystem not available (web environment)');
}

const ACTION_API_URL = getBackendUrl('actions');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SAMPLE_COUNT = Number(process.env.EXPO_PUBLIC_ACTION_SAMPLE_COUNT || 3);
const SAMPLE_INTERVAL_MS = Number(process.env.EXPO_PUBLIC_ACTION_SAMPLE_INTERVAL_MS || 100);

// Handle both web (video element) and React Native (photo object) inputs
const captureFrameBlob = async (input) => {
  // React Native: input is a photo object from expo-camera (only on native, not web)
  if (
    FileSystem &&
    input &&
    typeof input === 'object' &&
    input.uri &&
    !input.videoWidth &&
    Platform.OS !== 'web'
  ) {
    try {
      const base64 = await FileSystem.readAsStringAsync(input.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const blob = new Blob(
        [Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))],
        { type: 'image/jpeg' }
      );
      return blob;
    } catch (error) {
      console.error('[captureFrameBlob] Failed to read React Native photo:', error);
      return null;
    }
  }

  // Web: input is an HTML video element
  if (typeof document !== 'undefined' && input && input.videoWidth) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = input.videoWidth || 640;
      canvas.height = input.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(input, 0, 0, canvas.width, canvas.height);

      return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      });
    } catch (error) {
      console.error('[captureFrameBlob] Failed to capture web video frame:', error);
      return null;
    }
  }

  // Fallback: try to extract from data URL or other formats
  if (input && typeof input === 'object' && input.uri) {
    try {
      // Try fetching from URI (works for data URLs and web URLs)
      const response = await fetch(input.uri);
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('[captureFrameBlob] Failed to fetch from URI:', error);
      return null;
    }
  }

  console.warn('[captureFrameBlob] Invalid input - unable to process');
  return null;
};

const postPrediction = async (instruction, blob, index) => {
  const formData = new FormData();
  formData.append('file', blob, `frame_${index + 1}.jpg`);
  formData.append('instruction', instruction);

  const response = await fetch(`${ACTION_API_URL}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }

  return response.json();
};

const getScore = (item) => {
  const targetMet = item?.instruction_check?.target_met === true;
  const predicted = item?.prediction === 1;
  const probability = Number(item?.probability || 0);
  return (targetMet || predicted ? 1 : 0) + probability;
};

const aggregatePredictions = (samples) => {
  if (!samples.length) return null;

  const successful = samples.filter(
    (item) => item?.prediction === 1 || item?.instruction_check?.target_met === true
  );

  const probabilityAvg =
    samples.reduce((sum, item) => sum + Number(item?.probability || 0), 0) /
    samples.length;

  const bestSample = [...samples].sort((a, b) => getScore(b) - getScore(a))[0];

  const prediction = successful.length >= Math.ceil(samples.length / 2) ? 1 : 0;

  return {
    prediction,
    probability: Number(probabilityAvg.toFixed(4)),
    features: bestSample?.features || {},
    instruction_check: bestSample?.instruction_check || {},
    reason: bestSample?.reason,
    samples,
    sample_count: samples.length,
    success_count: successful.length,
  };
};

/**
 * Grabs one frame from either a <video> element (web) or expo-camera photo (React Native),
 * converts it to a JPEG Blob, and POSTs it to the action-detection API.
 *
 * @param {string}           instruction - Natural-language action description
 * @param {HTMLVideoElement|Object} input - The <video> ref (web) or photo object from takePictureAsync (React Native)
 * @returns {Promise<object|null>}       - Parsed JSON response or null on failure
 */
export const sendFrameToAPI = async (instruction, input) => {
  if (!input) {
    console.warn('[modelService] input is null — camera not ready');
    return null;
  }

  try {
    const sampleCount = Number.isFinite(SAMPLE_COUNT) && SAMPLE_COUNT > 0 ? SAMPLE_COUNT : 3;
    const results = [];

    for (let index = 0; index < sampleCount; index += 1) {
      const blob = await captureFrameBlob(input);
      if (blob) {
        try {
          const data = await postPrediction(instruction, blob, index);
          results.push(data);
        } catch (sampleError) {
          console.warn(`[modelService] Sample ${index + 1}: ${sampleError.message}`);
        }
      } else {
        console.warn(`[modelService] Sample ${index + 1}: failed to create blob`);
      }

      if (index < sampleCount - 1 && SAMPLE_INTERVAL_MS > 0) {
        await wait(SAMPLE_INTERVAL_MS);
      }
    }

    if (!results.length) {
      console.error('[modelService] All prediction samples failed');
      return null;
    }

    const aggregated = aggregatePredictions(results);
    console.log('[modelService] Aggregated prediction:', aggregated);
    return aggregated;
  } catch (error) {
    console.error('[modelService] sendFrameToAPI failed:', error);
    throw error;
  }
};
