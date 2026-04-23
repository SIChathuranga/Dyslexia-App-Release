import { getAuthSession, isSessionValid } from '../../../services/authSession';
import {
    getProgressStatsRemote,
    importProgressAttemptsRemote,
    saveProgressAttemptRemote,
    setAuthToken,
} from '../../../services/api';
import { getStorage } from '../../../services/storageAdapter';

const STORAGE_KEY = '@dyslexia_progress_attempts';
const PENDING_STORAGE_KEY = '@dyslexia_progress_pending_attempts';

const EMPTY_STATS = {
    wordsLearned: 0,
    wordsTotal: 0,
    spellingAccuracy: 0,
    weeklyStars: 0,
    weeklyStarsMax: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    weeklyProgress: [],
    isEmpty: true,
};

const readAttempts = async (key) => {
    const storage = await getStorage();
    const raw = await storage.getItem(key);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const writeAttempts = async (key, attempts) => {
    const storage = await getStorage();
    await storage.setItem(key, JSON.stringify(attempts));
};

const appendAttempt = async (key, attempt) => {
    const attempts = await readAttempts(key);
    attempts.push(attempt);
    await writeAttempts(key, attempts);
};

const getActiveSession = async () => {
    const session = await getAuthSession();
    if (!isSessionValid(session)) {
        return null;
    }
    return session;
};

const getLocalProgressStats = async () => {
    try {
        const attempts = await readAttempts(STORAGE_KEY);
        if (attempts.length === 0) {
            return EMPTY_STATS;
        }

        const wordSet = new Set();
        const learnedSet = new Set();
        let correctCount = 0;

        attempts.forEach((attempt) => {
            const word = (attempt.word || '').toUpperCase();
            if (word) {
                wordSet.add(word);
            }

            if (attempt.isCorrect) {
                correctCount += 1;
                if (word) {
                    learnedSet.add(word);
                }
            }
        });

        const now = Date.now();
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
        const weekAttempts = attempts.filter((attempt) => attempt.timestamp >= weekAgo);
        const weekCorrect = weekAttempts.filter((attempt) => attempt.isCorrect).length;

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyProgress = [];

        for (let i = 6; i >= 0; i -= 1) {
            const dayStart = new Date(now);
            dayStart.setDate(dayStart.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            const dayAttempts = attempts.filter(
                (attempt) =>
                    attempt.timestamp >= dayStart.getTime() &&
                    attempt.timestamp <= dayEnd.getTime()
            );

            const dayCorrect = dayAttempts.filter((attempt) => attempt.isCorrect).length;
            const accuracy = dayAttempts.length > 0
                ? Math.round((dayCorrect / dayAttempts.length) * 100)
                : 0;

            weeklyProgress.push({
                day: dayNames[dayStart.getDay()],
                accuracy,
                attempts: dayAttempts.length,
            });
        }

        return {
            wordsLearned: learnedSet.size,
            wordsTotal: wordSet.size,
            spellingAccuracy: Math.round((correctCount / attempts.length) * 100),
            weeklyStars: weekCorrect,
            weeklyStarsMax: weekAttempts.length,
            totalAttempts: attempts.length,
            correctAttempts: correctCount,
            weeklyProgress,
            isEmpty: false,
        };
    } catch (error) {
        console.error('Failed to compute local progress:', error);
        return EMPTY_STATS;
    }
};

const syncPendingAttempts = async () => {
    const pending = await readAttempts(PENDING_STORAGE_KEY);
    if (pending.length === 0) {
        return 0;
    }

    await importProgressAttemptsRemote(pending);
    const storage = await getStorage();
    await storage.removeItem(PENDING_STORAGE_KEY);
    return pending.length;
};

/**
 * Record a single speech attempt.
 * @param {string} word — the object label the child tried to say
 * @param {boolean} isCorrect — whether the attempt was correct
 */
export const recordAttempt = async (word, isCorrect) => {
    const attempt = {
        word: (word || '').toUpperCase(),
        isCorrect: Boolean(isCorrect),
        timestamp: Date.now(),
    };

    try {
        await appendAttempt(STORAGE_KEY, attempt);
    } catch (error) {
        console.error('Failed to save local progress:', error);
    }

    const session = await getActiveSession();
    if (!session) {
        await appendAttempt(PENDING_STORAGE_KEY, attempt);
        return;
    }

    setAuthToken(session.token);

    try {
        await saveProgressAttemptRemote(attempt);
    } catch (error) {
        await appendAttempt(PENDING_STORAGE_KEY, attempt);
        console.warn('Remote save failed; queued attempt for sync.');
    }
};

/**
 * Compute aggregate stats from all stored attempts.
 */
export const getProgressStats = async () => {
    const session = await getActiveSession();
    if (session) {
        setAuthToken(session.token);
        try {
            await syncPendingAttempts();
            return await getProgressStatsRemote();
        } catch (error) {
            console.warn('Remote progress unavailable; falling back to local stats.');
        }
    }

    return getLocalProgressStats();
};

export const flushPendingProgress = async () => {
    try {
        const session = await getActiveSession();
        if (!session) {
            return 0;
        }
        setAuthToken(session.token);
        return await syncPendingAttempts();
    } catch (error) {
        console.warn('Failed to sync pending progress attempts.');
        return 0;
    }
};

/**
 * Clear all stored progress (useful for testing / reset).
 */
export const clearProgress = async () => {
    try {
        const storage = await getStorage();
        await storage.removeItem(STORAGE_KEY);
        await storage.removeItem(PENDING_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear progress:', error);
    }
};
