import axios from 'axios';
import { getBackendUrl } from './apiHub';

const resolveBaseUrl = () => {
    return getBackendUrl('photoSpelling');
};

const resolveActionsBaseUrl = () => {
    return getBackendUrl('actions');
};

const BASE_URL = resolveBaseUrl();
const ACTIONS_BASE_URL = resolveActionsBaseUrl();

console.log('[API] Initializing API clients:', { BASE_URL, ACTIONS_BASE_URL });

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'multipart/form-data',
    },
    timeout: 120000, // 120s — HF Spaces cold start (30-60s) + ML inference (up to 30s)
});

const jsonApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000,
});

const actionsApi = axios.create({
    baseURL: ACTIONS_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000,
});

console.log('[API] actionsApi created:', { baseURL: actionsApi.defaults.baseURL });

/**
 * Check if an error is retryable (network, timeout, or 503 from cold start).
 */
const isRetryableError = (error) => {
    if (error.message === 'Network Error') return true;
    if (error.code === 'ECONNABORTED') return true; // timeout
    if (error.response?.status === 503) return true; // service waking up
    return false;
};

const apiRuntimeConfig = {
    offlineMode: false,
};

let authToken = null;

const applyAuthHeader = (config) => {
    if (authToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${authToken}`;
        console.log('[API] Auth header applied:', { token: `${authToken.substring(0, 20)}...` });
    } else {
        console.warn('[API] No auth token set!');
    }
    return config;
};

api.interceptors.request.use(applyAuthHeader);
jsonApi.interceptors.request.use(applyAuthHeader);
actionsApi.interceptors.request.use(applyAuthHeader);

console.log('[API] Interceptors attached to all axios instances');

export const setAuthToken = (token) => {
    authToken = token || null;
};

export const setApiRuntimeConfig = (nextConfig = {}) => {
    apiRuntimeConfig.offlineMode = Boolean(nextConfig.offlineMode);
};

const ensureOnline = () => {
    if (apiRuntimeConfig.offlineMode) {
        const error = new Error('Offline mode is enabled. Network requests are disabled.');
        error.code = 'OFFLINE_MODE';
        throw error;
    }
};

export const detectObject = async (imageUri, _retries = 2) => {
    try {
        ensureOnline();
        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        });

        const response = await api.post('/detect-object', formData);
        return response.data;
    } catch (error) {
        if (_retries > 0 && isRetryableError(error)) {
            const delay = 2000 * (3 - _retries); // 2s, 4s
            console.log(`detectObject retry (${_retries} left) after ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
            return detectObject(imageUri, _retries - 1);
        }
        console.error("Detect Object Error:", error.message);
        if (error.response) {
            console.error("Server Error Detail:", error.response.data);
        }
        throw error;
    }
};

// ---------------- Auth ----------------
export const registerUser = async ({ name, email, password }) => {
    ensureOnline();
    const response = await jsonApi.post('/auth/register', {
        name,
        email,
        password,
    });
    return response.data;
};

export const loginUser = async ({ email, password }) => {
    ensureOnline();
    const response = await jsonApi.post('/auth/login', {
        email,
        password,
    });
    return response.data;
};

export const getCurrentUser = async () => {
    ensureOnline();
    const response = await jsonApi.get('/auth/me');
    return response.data;
};

export const logoutUser = async () => {
    ensureOnline();
    const response = await jsonApi.post('/auth/logout');
    return response.data;
};

// ---------------- Progress Sync ----------------
export const saveProgressAttemptRemote = async ({ word, isCorrect, timestamp }) => {
    ensureOnline();
    const response = await jsonApi.post('/progress/attempt', {
        word: word || '',
        isCorrect: Boolean(isCorrect),
        timestamp: timestamp || Date.now(),
    });
    return response.data;
};

export const importProgressAttemptsRemote = async (attempts = []) => {
    ensureOnline();
    const response = await jsonApi.post('/progress/import', {
        attempts: attempts.map((attempt) => ({
            word: attempt.word || '',
            isCorrect: Boolean(attempt.isCorrect),
            timestamp: attempt.timestamp || Date.now(),
        })),
    });
    return response.data;
};

export const getProgressStatsRemote = async () => {
    ensureOnline();
    const response = await jsonApi.get('/progress/stats');
    return response.data;
};

// ---------------- Assessment History ----------------
export const saveAssessmentHistoryRemote = async (payload) => {
    try {
        ensureOnline();
        console.log('[API:saveAssessment] Request Start', {
            endpoint: '/assessment-history/save',
            baseURL: ACTIONS_BASE_URL,
            payload,
            hasAuthToken: !!authToken,
        });
        
        const response = await actionsApi.post('/assessment-history/save', payload);
        
        console.log('[API:saveAssessment] Response Success', {
            endpoint: '/assessment-history/save',
            status: response.status,
            data: response.data,
        });
        return response.data;
    } catch (error) {
        console.error('[API:saveAssessment] Request Failed', {
            endpoint: '/assessment-history/save',
            baseURL: ACTIONS_BASE_URL,
            payload,
            status: error.response?.status,
            statusText: error.response?.statusText,
            errorData: error.response?.data,
            message: error.message,
            code: error.code,
        });
        throw error;
    }
};

export const fetchAssessmentHistoryRemote = async (payload) => {
    try {
        ensureOnline();
        console.log('[API:fetchAssessment] Request Start', {
            endpoint: '/assessment-history/list',
            baseURL: ACTIONS_BASE_URL,
            payload,
            hasAuthToken: !!authToken,
        });
        
        const response = await actionsApi.post('/assessment-history/list', payload);
        
        console.log('[API:fetchAssessment] Response Success', {
            endpoint: '/assessment-history/list',
            status: response.status,
            assessmentsCount: response.data?.assessments?.length || 0,
        });
        return response.data;
    } catch (error) {
        console.error('[API:fetchAssessment] Request Failed', {
            endpoint: '/assessment-history/list',
            baseURL: ACTIONS_BASE_URL,
            payload,
            status: error.response?.status,
            statusText: error.response?.statusText,
            errorData: error.response?.data,
            message: error.message,
            code: error.code,
        });
        throw error;
    }
};

export const transcribeAudio = async (audioUri, _retries = 3) => {
    try {
        ensureOnline();
        if (!audioUri) {
            throw new Error('No audio URI provided — recording may have failed');
        }
        const formData = new FormData();
        formData.append('file', {
            uri: audioUri,
            name: 'audio.m4a',
            type: 'audio/mp4',
        });

        const response = await api.post('/speech-to-text', formData, {
            timeout: 180000, // 180s — cold start + Whisper inference on free CPU
        });
        return response.data;
    } catch (error) {
        if (_retries > 0 && isRetryableError(error)) {
            const delay = 2000 * (4 - _retries); // 2s, 4s, 6s
            console.log(`Transcribe retry (${_retries} left) after ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
            return transcribeAudio(audioUri, _retries - 1);
        }
        console.error("Transcribe Audio Error:", error);
        throw error;
    }
};

export const verifyAnswer = async (detectedLabel, spokenText, _retries = 2) => {
    try {
        ensureOnline();
        const response = await jsonApi.post('/verify-answer', null, {
            params: {
                detected_label: detectedLabel,
                spoken_text: spokenText,
            },
        });
        return response.data;
    } catch (error) {
        if (_retries > 0 && isRetryableError(error)) {
            const delay = 1500 * (3 - _retries);
            await new Promise((r) => setTimeout(r, delay));
            return verifyAnswer(detectedLabel, spokenText, _retries - 1);
        }
        console.error("Verify Answer Error:", error);
        throw error;
    }
};

// Combined function: transcribe audio and verify against expected word
export const verifyVoice = async (audioUri, expectedWord) => {
    try {
        // Step 1: Transcribe the audio
        const transcribeResult = await transcribeAudio(audioUri);
        const transcribedText = transcribeResult.text || '';

        console.log('Transcribed:', transcribedText, 'Expected:', expectedWord);

        if (!transcribedText.trim()) {
            return {
                isMatch: false,
                is_match: false,
                transcribedText: '',
                transcribed_text: '',
            };
        }

        // Step 2: Validate with backend verification logic
        const verification = await verifyAnswer(expectedWord || '', transcribedText);
        const isMatch = Boolean(verification?.correct);

        return {
            isMatch,
            is_match: isMatch,
            transcribedText,
            transcribed_text: transcribedText,
        };
    } catch (error) {
        console.error("Verify Voice Error:", error);
        throw error;
    }
};

/**
 * Warm up the backend — call this early to wake HF Spaces from sleep.
 * Resolves true if backend is reachable, false otherwise.
 */
export const warmUpBackend = async () => {
    try {
        await jsonApi.get('/', { timeout: 90000 });
        return true;
    } catch {
        return false;
    }
};
