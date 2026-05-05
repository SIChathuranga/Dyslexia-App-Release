import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthSession, isSessionValid } from '../../../services/authSession';
import {
  fetchAssessmentHistoryRemote,
  saveAssessmentHistoryRemote,
  setAuthToken,
} from '../../../services/api';

const STORAGE_KEY = 'dyslearn_assessments';

const toNumberOrNull = (value) => {
  const n = Number(value);
  const result = Number.isFinite(n) ? n : null;
  console.log('[toNumberOrNull]', { input: value, output: result });
  return result;
};

const getSessionUserId = (session) => {
  console.log('[getSessionUserId] Full session object:', JSON.stringify(session, null, 2));
  
  const rawId =
    session?.user?.id ??
    session?.user?.user_id ??
    session?.user_id ??
    session?.id;

  console.log('[getSessionUserId] Raw ID extracted:', rawId);
  
  const result = toNumberOrNull(rawId);
  console.log('[getSessionUserId] Final result:', result);
  
  return result;
};

const getAssessmentPayload = ({ modelPrediction, type, summary, timestamp, userId }) => {
  console.log('[getAssessmentPayload] Creating payload', {
    type,
    userId,
    modelPrediction,
    timestamp,
  });

  const probability = Number(modelPrediction?.probability ?? 0);
  const boundedProbability = Math.max(0, Math.min(1, probability));
  const features = modelPrediction?.features || {};

  const sequenceAccuracy = Number(features.sequence_accuracy);
  const completionRate = Number.isFinite(sequenceAccuracy)
    ? Math.max(0, Math.min(1, sequenceAccuracy)) * 100
    : boundedProbability * 100;

  const reactionTime = Number(features.reaction_time);
  const responseTime = Number.isFinite(reactionTime) ? reactionTime : 0;

  const finalPayload = {
    user_id: userId,
    accuracy: Number((boundedProbability * 100).toFixed(2)),
    completion_rate: Number(completionRate.toFixed(2)),
    response_time: responseTime,
    satisfaction_score: modelPrediction?.prediction === 1 ? 5 : 3,
    assessment_date: timestamp,
    assessment_type: type,
    notes: summary || '',
  };

  console.log('[getAssessmentPayload] Final payload', finalPayload);
  return finalPayload;
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
    console.log('[assessmentHelper] Starting assessment save:', { type, summary });
    
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

    // Save locally first
    const existing = await loadAssessments();
    const updated = [record, ...existing].slice(0, 100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('[assessmentHelper] Local storage saved:', record.id);

    // Try to save remotely
    const session = await getAuthSession();
    console.log('[assessmentHelper] Session check - Valid?', isSessionValid(session));
    console.log('[assessmentHelper] Full session object:', JSON.stringify(session, null, 2));
    
    if (isSessionValid(session)) {
      const userId = getSessionUserId(session);
      console.log('[assessmentHelper] Extracted userId:', userId);
      
      if (userId) {
        setAuthToken(session.token);
        const payload = getAssessmentPayload({
          modelPrediction,
          type,
          summary,
          timestamp,
          userId,
        });
        
        console.log('[assessmentHelper] About to call saveAssessmentHistoryRemote with payload:', payload);

        try {
          const response = await saveAssessmentHistoryRemote(payload);
          console.log('[assessmentHelper] Remote save SUCCESS:', response);
        } catch (remoteError) {
          console.error('[assessmentHelper] Remote assessment save FAILED:', {
            message: remoteError?.message,
            response: remoteError?.response?.data,
            status: remoteError?.response?.status,
            statusText: remoteError?.response?.statusText,
            code: remoteError?.code,
            config: {
              url: remoteError?.config?.url,
              method: remoteError?.config?.method,
              baseURL: remoteError?.config?.baseURL,
            },
            fullError: remoteError,
          });
          // Local persistence already succeeded; keep UX non-blocking.
        }
      } else {
        console.warn('[assessmentHelper] No user ID found in session');
      }
    } else {
      console.warn('[assessmentHelper] Session not valid - cannot save remotely');
    }

    console.log('[assessmentHelper] Assessment completed:', record.id);
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
