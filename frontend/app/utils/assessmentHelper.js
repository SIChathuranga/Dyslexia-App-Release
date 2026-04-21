import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthSession, isSessionValid } from '../services/authSession';
import {
  fetchAssessmentHistoryRemote,
  saveAssessmentHistoryRemote,
  setAuthToken,
} from '../services/api';

const STORAGE_KEY = 'dyslearn_assessments';

const toNumberOrNull = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const getSessionUserId = (session) => {
  const rawId =
    session?.user?.id ??
    session?.user?.user_id ??
    session?.user_id ??
    session?.id;

  return toNumberOrNull(rawId);
};

const getAssessmentPayload = ({ modelPrediction, type, summary, timestamp, userId }) => {
  const probability = Number(modelPrediction?.probability ?? 0);
  const boundedProbability = Math.max(0, Math.min(1, probability));
  const features = modelPrediction?.features || {};

  const sequenceAccuracy = Number(features.sequence_accuracy);
  const completionRate = Number.isFinite(sequenceAccuracy)
    ? Math.max(0, Math.min(1, sequenceAccuracy)) * 100
    : boundedProbability * 100;

  const reactionTime = Number(features.reaction_time);
  const responseTime = Number.isFinite(reactionTime) ? reactionTime : 0;

  return {
    user_id: userId,
    accuracy: Number((boundedProbability * 100).toFixed(2)),
    completion_rate: Number(completionRate.toFixed(2)),
    response_time: responseTime,
    satisfaction_score: modelPrediction?.prediction === 1 ? 5 : 3,
    assessment_date: timestamp,
    assessment_type: type,
    notes: summary || '',
  };
};

/**
 * @typedef {Object} AssessmentRecord
 * @property {string}  id          - Unique timestamp-based ID
 * @property {string}  type        - 'MEMORY_ASSESSMENT' | 'INSTRUCTION_ASSESSMENT'
 * @property {string}  summary     - Human-readable result summary
 * @property {number}  prediction  - 0 | 1
 * @property {number}  probability - 0-1 confidence / score percentage
 * @property {Object}  features    - Raw motion metrics from the model
 * @property {string}  timestamp   - ISO date string
 */

/**
 * Load all stored assessments.
 * @returns {Promise<AssessmentRecord[]>}
 */
export const loadAssessments = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local = raw ? JSON.parse(raw) : [];

    const session = await getAuthSession();
    if (!isSessionValid(session)) {
      return local;
    }

    const userId = getSessionUserId(session);
    if (!userId) {
      return local;
    }

    setAuthToken(session.token);
    const response = await fetchAssessmentHistoryRemote({ user_id: userId, page: 0, size: 100 });
    const remoteAssessments = Array.isArray(response?.assessments)
      ? response.assessments
      : [];

    if (!remoteAssessments.length) {
      return local;
    }

    const remoteMapped = remoteAssessments.map((item) => ({
      id: `${item.assessment_type || 'ASSESSMENT'}_${item.id || item.assessment_date || Date.now()}`,
      type: item.assessment_type || 'ASSESSMENT',
      summary: item.notes || '',
      prediction: Number(item.accuracy || 0) >= 50 ? 1 : 0,
      probability: Math.max(0, Math.min(1, Number(item.accuracy || 0) / 100)),
      features: {},
      timestamp: item.assessment_date || new Date().toISOString(),
      source: 'remote',
    }));

    // Keep local entries at the top (optimistic/offline), then append remote history.
    return [...local, ...remoteMapped].slice(0, 100);
  } catch (error) {
    console.error('[assessmentHelper] Failed to load assessments:', error);
    return [];
  }
};

/**
 * Persist a new assessment entry derived from a model prediction.
 *
 * @param {Object} modelPrediction - { prediction, probability, features }
 * @param {string} type            - 'MEMORY_ASSESSMENT' | 'INSTRUCTION_ASSESSMENT'
 * @param {string} summary         - Human-readable description of the result
 * @returns {Promise<AssessmentRecord>}  The saved record
 */
export const saveModelPredictionAsAssessment = async (
  modelPrediction,
  type,
  summary
) => {
  try {
    const timestamp = new Date().toISOString();
    const record = {
      id: `${type}_${Date.now()}`,
      type,
      summary,
      prediction:  modelPrediction.prediction  ?? 0,
      probability: modelPrediction.probability ?? 0,
      features:    modelPrediction.features    ?? {},
      timestamp,
    };

    const existing = await loadAssessments();
    // Newest first — keep last 100 records maximum
    const updated = [record, ...existing].slice(0, 100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    const session = await getAuthSession();
    if (isSessionValid(session)) {
      const userId = getSessionUserId(session);
      if (userId) {
        setAuthToken(session.token);
        const payload = getAssessmentPayload({
          modelPrediction,
          type,
          summary,
          timestamp,
          userId,
        });

        try {
          await saveAssessmentHistoryRemote(payload);
        } catch (remoteError) {
          // Local persistence already succeeded; keep UX non-blocking.
          console.warn('[assessmentHelper] Remote assessment save failed:', remoteError?.message || remoteError);
        }
      }
    }

    console.log('[assessmentHelper] Assessment saved:', record.id);
    return record;
  } catch (error) {
    console.error('[assessmentHelper] Failed to save assessment:', error);
    throw error;
  }
};

/**
 * Clear all stored assessments (useful for testing / reset).
 */
export const clearAssessments = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
