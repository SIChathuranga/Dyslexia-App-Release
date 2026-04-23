import { getBackendUrl } from '../../../services/apiHub';

const ACTION_API_URL = getBackendUrl('actions');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SAMPLE_COUNT = Number(process.env.EXPO_PUBLIC_ACTION_SAMPLE_COUNT || 3);
const SAMPLE_INTERVAL_MS = Number(process.env.EXPO_PUBLIC_ACTION_SAMPLE_INTERVAL_MS || 100);

const captureFrameBlob = async (videoEl) => {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.85);
  });
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
 * Grabs one frame from a <video> element via an off-screen <canvas>,
 * converts it to a JPEG Blob, and POSTs it to the action-detection API.
 *
 * @param {string}           instruction - Natural-language action description
 * @param {HTMLVideoElement} videoEl     - The always-mounted hidden <video> ref
 * @returns {Promise<object|null>}       - Parsed JSON response or null on failure
 */
export const sendFrameToAPI = async (instruction, videoEl) => {
  if (!videoEl) {
    console.warn('[modelService] videoEl is null — camera not ready');
    return null;
  }

  try {
    const sampleCount = Number.isFinite(SAMPLE_COUNT) && SAMPLE_COUNT > 0 ? SAMPLE_COUNT : 3;
    const results = [];

    for (let index = 0; index < sampleCount; index += 1) {
      const blob = await captureFrameBlob(videoEl);
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
