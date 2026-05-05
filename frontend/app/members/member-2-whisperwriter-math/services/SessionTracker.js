/**
 * ================================================================================
 * SESSION TRACKER SERVICE
 * ================================================================================
 *
 * Tracks patient (child) progress data across all 4 learning activities:
 *   1. Letter Practice (A-Z letter drawing)
 *   2. Math Practice (arithmetic problem solving)
 *   3. Word Count Practice (counting letters in words)
 *   4. Letter Hunt (finding letters in number words)
 *
 * Records:
 *   - Attempts per activity (correct/incorrect)
 *   - Time spent per session
 *   - Accuracy rates
 *   - Commonly confused letters/numbers
 *   - Progress over multiple sessions
 *   - Parent improvement suggestions
 *
 * Data is stored in MongoDB Atlas via backend API (cloud-only mode).
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import { DataSyncService } from './DataSyncService';
// ============================================================================
// ACTIVITY DISPLAY NAMES
// ============================================================================
export const ACTIVITY_DISPLAY_NAMES = {
    letter_practice: 'Letter Practice',
    math_practice: 'Math Practice',
    word_count: 'Word Count',
    letter_hunt: 'Letter Hunt',
};
export const ACTIVITY_EMOJIS = {
    letter_practice: '✏️',
    math_practice: '🔢',
    word_count: '📝',
    letter_hunt: '🔍',
};
export const ACTIVITY_COLORS = {
    letter_practice: '#96ADFC',
    math_practice: '#B987DC',
    word_count: '#A5F7E1',
    letter_hunt: '#EDD1B0',
};
// ============================================================================
// SESSION TRACKER CLASS
// ============================================================================
class SessionTrackerService {
    currentSessionId = null;
    sessionStartTime = null;
    challengeStartTime = null;
    currentRetryCount = 0;
    lastExpected = null;
    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================
    /**
     * Start a new session (call when entering an activity screen)
     */
    startSession() {
        this.currentSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        this.sessionStartTime = Date.now();
        this.currentRetryCount = 0;
        this.lastExpected = null;
        // Process any queued sync items from previous offline sessions
        DataSyncService.processSyncQueue().catch(() => { });
        return this.currentSessionId;
    }
    /**
     * End the current session
     */
    async endSession() {
        if (!this.currentSessionId || !this.sessionStartTime)
            return;
        const sessionSummary = {
            id: this.currentSessionId,
            startTime: this.sessionStartTime,
            endTime: Date.now(),
            durationMs: Date.now() - this.sessionStartTime,
            attempts: [],
            activityBreakdown: {},
        };
        const synced = await DataSyncService.syncSession(sessionSummary);
        if (!synced) {
            console.warn('Failed to sync session to MongoDB');
        }
        this.currentSessionId = null;
        this.sessionStartTime = null;
    }
    // ========================================================================
    // CHALLENGE TRACKING
    // ========================================================================
    /**
     * Mark the start of a new challenge (when a new letter/problem is shown)
     */
    startChallenge(expected) {
        if (expected !== this.lastExpected) {
            this.currentRetryCount = 0;
            this.lastExpected = expected;
        }
        this.challengeStartTime = Date.now();
    }
    /**
     * Record an attempt (call after each check)
     */
    async recordAttempt(activity, expected, predicted, isCorrect, context) {
        const responseTimeMs = this.challengeStartTime
            ? Date.now() - this.challengeStartTime
            : 0;
        if (!isCorrect) {
            this.currentRetryCount++;
        }
        const attempt = {
            id: `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            activity,
            timestamp: Date.now(),
            expected,
            predicted,
            isCorrect,
            responseTimeMs,
            retryCount: this.currentRetryCount,
            context,
        };
        const synced = await DataSyncService.syncAttempt(attempt);
        if (!synced) {
            console.warn('Failed to sync attempt to MongoDB');
        }
        if (isCorrect) {
            this.currentRetryCount = 0;
        }
    }
    // ========================================================================
    // DATA RETRIEVAL
    // ========================================================================
    /**
     * Get all stored attempts
     */
    async getAttempts() {
        try {
            return await DataSyncService.fetchCloudAttempts(undefined, 5000);
        }
        catch {
            return [];
        }
    }
    /**
     * Get all sessions
     */
    async getSessions() {
        try {
            return await DataSyncService.fetchCloudSessions(1000);
        }
        catch {
            return [];
        }
    }
    // ========================================================================
    // ANALYSIS & INSIGHTS
    // ========================================================================
    /**
     * Generate complete patient analysis with all visualisation data
     */
    async generateAnalysis() {
        const attempts = await this.getAttempts();
        const sessions = await this.getSessions();
        // Activity stats
        const activityStats = this.calculateActivityStats(attempts);
        // Weekly progress
        const weeklyProgress = this.calculateWeeklyProgress(attempts);
        // Confusion matrix
        const confusionMatrix = this.calculateConfusionMatrix(attempts);
        // Suggestions
        const suggestions = this.generateSuggestions(activityStats, confusionMatrix, attempts);
        // Streaks
        const { currentStreak, longestStreak } = this.calculateStreaks(attempts);
        // Overall stats
        const totalAttempts = attempts.length;
        const correctAttempts = attempts.filter(a => a.isCorrect).length;
        return {
            totalSessions: sessions.length,
            totalAttempts,
            overallAccuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
            totalPracticeTimeMs: sessions.reduce((sum, s) => sum + s.durationMs, 0),
            activityStats,
            weeklyProgress,
            confusionMatrix,
            suggestions,
            currentStreakDays: currentStreak,
            longestStreakDays: longestStreak,
            lastActivityDate: attempts.length > 0
                ? Math.max(...attempts.map(a => a.timestamp))
                : null,
        };
    }
    /**
     * Calculate per-activity statistics
     */
    calculateActivityStats(attempts) {
        const activities = ['letter_practice', 'math_practice', 'word_count', 'letter_hunt'];
        return activities.map(activity => {
            const activityAttempts = attempts.filter(a => a.activity === activity);
            const correct = activityAttempts.filter(a => a.isCorrect).length;
            const total = activityAttempts.length;
            // Calculate most confused items
            const confusionMap = new Map();
            activityAttempts
                .filter(a => !a.isCorrect)
                .forEach(a => {
                const key = `${a.expected}→${a.predicted}`;
                confusionMap.set(key, (confusionMap.get(key) || 0) + 1);
            });
            const mostConfused = Array.from(confusionMap.entries())
                .map(([key, count]) => {
                const [expected, predicted] = key.split('→');
                return { expected, predicted, count };
            })
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            // Calculate trend (last 10 vs previous 10)
            const recentTrend = this.calculateTrend(activityAttempts);
            // Average response time
            const avgResponseTimeMs = total > 0
                ? activityAttempts.reduce((sum, a) => sum + a.responseTimeMs, 0) / total
                : 0;
            // Streak
            const streakDays = this.calculateActivityStreak(activityAttempts);
            return {
                activity,
                totalAttempts: total,
                correctAttempts: correct,
                accuracy: total > 0 ? (correct / total) * 100 : 0,
                avgResponseTimeMs,
                mostConfused,
                recentTrend,
                streakDays,
            };
        });
    }
    /**
     * Calculate weekly progress for charts
     */
    calculateWeeklyProgress(attempts) {
        if (attempts.length === 0)
            return [];
        const weeks = [];
        const now = Date.now();
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        // Look back 8 weeks
        for (let i = 7; i >= 0; i--) {
            const weekEnd = now - (i * msPerWeek);
            const weekStart = weekEnd - msPerWeek;
            const weekAttempts = attempts.filter(a => a.timestamp >= weekStart && a.timestamp < weekEnd);
            const correct = weekAttempts.filter(a => a.isCorrect).length;
            const total = weekAttempts.length;
            const playedActivities = [...new Set(weekAttempts.map(a => a.activity))];
            const weekLabel = `W${8 - i}`;
            weeks.push({
                weekLabel,
                weekStart,
                weekEnd,
                totalAttempts: total,
                totalCorrect: correct,
                accuracy: total > 0 ? (correct / total) * 100 : 0,
                activitiesPlayed: playedActivities,
                avgResponseTimeMs: total > 0
                    ? weekAttempts.reduce((sum, a) => sum + a.responseTimeMs, 0) / total
                    : 0,
                sessionsCount: playedActivities.length, // approximate
            });
        }
        return weeks;
    }
    /**
     * Calculate confusion matrix (most commonly confused items)
     */
    calculateConfusionMatrix(attempts) {
        const confusionMap = new Map();
        attempts
            .filter(a => !a.isCorrect)
            .forEach(a => {
            const key = `${a.activity}:${a.expected}→${a.predicted}`;
            const existing = confusionMap.get(key);
            if (existing) {
                existing.count++;
            }
            else {
                confusionMap.set(key, {
                    expected: a.expected,
                    predicted: a.predicted,
                    count: 1,
                    activity: a.activity,
                });
            }
        });
        return Array.from(confusionMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }
    /**
     * Generate parent-facing improvement suggestions
     */
    generateSuggestions(activityStats, confusionMatrix, attempts) {
        const suggestions = [];
        let suggId = 0;
        // === STRENGTHS ===
        activityStats.forEach(stat => {
            if (stat.accuracy >= 80 && stat.totalAttempts >= 10) {
                suggestions.push({
                    id: `sugg_${suggId++}`,
                    category: 'strength',
                    icon: '⭐',
                    title: `Excellent at ${ACTIVITY_DISPLAY_NAMES[stat.activity]}!`,
                    message: `Your child has ${stat.accuracy.toFixed(0)}% accuracy in ${ACTIVITY_DISPLAY_NAMES[stat.activity]} with ${stat.totalAttempts} attempts. This is outstanding performance!`,
                    priority: 3,
                    relatedActivity: stat.activity,
                });
            }
        });
        // === AREAS FOR IMPROVEMENT ===
        activityStats.forEach(stat => {
            if (stat.accuracy < 50 && stat.totalAttempts >= 5) {
                suggestions.push({
                    id: `sugg_${suggId++}`,
                    category: 'improvement',
                    icon: '💡',
                    title: `More Practice Needed: ${ACTIVITY_DISPLAY_NAMES[stat.activity]}`,
                    message: `Accuracy is ${stat.accuracy.toFixed(0)}% in ${ACTIVITY_DISPLAY_NAMES[stat.activity]}. Consider spending 5-10 minutes daily on this activity. Use the practice consistently for best results.`,
                    priority: 1,
                    relatedActivity: stat.activity,
                });
            }
        });
        // === CONFUSED LETTERS/NUMBERS ===
        if (confusionMatrix.length > 0) {
            const topConfused = confusionMatrix.slice(0, 3);
            topConfused.forEach(conf => {
                suggestions.push({
                    id: `sugg_${suggId++}`,
                    category: 'practice',
                    icon: '🔄',
                    title: `Common Mix-up: "${conf.expected}" vs "${conf.predicted}"`,
                    message: `Your child often confuses "${conf.expected}" with "${conf.predicted}" (${conf.count} times). Try practicing with physical letter tiles or tracing activities to reinforce the distinction.`,
                    priority: 2,
                    relatedActivity: conf.activity,
                });
            });
        }
        // === UNDER-PRACTICED ACTIVITIES ===
        activityStats.forEach(stat => {
            if (stat.totalAttempts === 0) {
                suggestions.push({
                    id: `sugg_${suggId++}`,
                    category: 'practice',
                    icon: '🎯',
                    title: `Try ${ACTIVITY_DISPLAY_NAMES[stat.activity]}!`,
                    message: `Your child hasn't tried ${ACTIVITY_DISPLAY_NAMES[stat.activity]} yet. Each activity targets different skills — encourage them to try all four!`,
                    priority: 2,
                    relatedActivity: stat.activity,
                });
            }
            else if (stat.totalAttempts < 5) {
                suggestions.push({
                    id: `sugg_${suggId++}`,
                    category: 'practice',
                    icon: '📈',
                    title: `More ${ACTIVITY_DISPLAY_NAMES[stat.activity]} Practice`,
                    message: `Your child has only ${stat.totalAttempts} attempts in ${ACTIVITY_DISPLAY_NAMES[stat.activity]}. Encourage regular practice — 10 minutes a day makes a big difference!`,
                    priority: 2,
                    relatedActivity: stat.activity,
                });
            }
        });
        // === RESPONSE TIME CONCERNS ===
        activityStats.forEach(stat => {
            if (stat.avgResponseTimeMs > 30000 && stat.totalAttempts >= 5) {
                suggestions.push({
                    id: `sugg_${suggId++}`,
                    category: 'improvement',
                    icon: '⏱️',
                    title: `Slow Responses in ${ACTIVITY_DISPLAY_NAMES[stat.activity]}`,
                    message: `Average response time is ${(stat.avgResponseTimeMs / 1000).toFixed(0)} seconds. This may indicate difficulty with the concepts. Try working through problems together with your child first.`,
                    priority: 2,
                    relatedActivity: stat.activity,
                });
            }
        });
        // === ENCOURAGEMENTS ===
        if (attempts.length >= 20) {
            const recentAttempts = attempts.slice(-20);
            const recentAccuracy = recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length * 100;
            const olderAttempts = attempts.slice(0, -20);
            if (olderAttempts.length >= 10) {
                const olderAccuracy = olderAttempts.filter(a => a.isCorrect).length / olderAttempts.length * 100;
                if (recentAccuracy > olderAccuracy + 10) {
                    suggestions.push({
                        id: `sugg_${suggId++}`,
                        category: 'encouragement',
                        icon: '🚀',
                        title: 'Great Improvement!',
                        message: `Your child's recent accuracy (${recentAccuracy.toFixed(0)}%) is significantly better than before (${olderAccuracy.toFixed(0)}%). Keep up the great work!`,
                        priority: 1,
                    });
                }
            }
        }
        // === CONSISTENCY ===
        const { currentStreak } = this.calculateStreaks(attempts);
        if (currentStreak >= 3) {
            suggestions.push({
                id: `sugg_${suggId++}`,
                category: 'encouragement',
                icon: '🔥',
                title: `${currentStreak}-Day Streak!`,
                message: `Amazing consistency! Your child has practiced for ${currentStreak} consecutive days. Research shows consistent daily practice is key to improvement.`,
                priority: 1,
            });
        }
        else if (currentStreak === 0 && attempts.length > 0) {
            suggestions.push({
                id: `sugg_${suggId++}`,
                category: 'practice',
                icon: '📅',
                title: 'Let\'s Get Back on Track!',
                message: 'Daily practice helps build skills faster. Even 5 minutes of practice each day can make a significant difference in your child\'s progress.',
                priority: 1,
            });
        }
        // Sort by priority
        return suggestions.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Calculate trend from recent attempts
     */
    calculateTrend(attempts) {
        if (attempts.length < 10)
            return 'stable';
        const recentHalf = attempts.slice(-Math.floor(attempts.length / 2));
        const olderHalf = attempts.slice(0, Math.floor(attempts.length / 2));
        const recentAccuracy = recentHalf.filter(a => a.isCorrect).length / recentHalf.length;
        const olderAccuracy = olderHalf.filter(a => a.isCorrect).length / olderHalf.length;
        const diff = recentAccuracy - olderAccuracy;
        if (diff > 0.1)
            return 'improving';
        if (diff < -0.1)
            return 'declining';
        return 'stable';
    }
    /**
     * Calculate day streaks
     */
    calculateStreaks(attempts) {
        if (attempts.length === 0)
            return { currentStreak: 0, longestStreak: 0 };
        // Get unique practice days
        const days = new Set(attempts.map(a => {
            const d = new Date(a.timestamp);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }));
        const sortedDays = Array.from(days).sort((left, right) => left.localeCompare(right));
        if (sortedDays.length === 0)
            return { currentStreak: 0, longestStreak: 0 };
        // Calculate streaks
        let currentStreak = 1;
        let longestStreak = 1;
        let tempStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
            const prev = new Date(sortedDays[i - 1]);
            const curr = new Date(sortedDays[i]);
            const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays <= 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            }
            else {
                tempStreak = 1;
            }
        }
        // Check if current streak includes today
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;
        const latestDay = sortedDays.at(-1);
        if (latestDay === todayStr || latestDay === yesterdayStr) {
            currentStreak = tempStreak;
        }
        else {
            currentStreak = 0;
        }
        return { currentStreak, longestStreak };
    }
    /**
     * Calculate streak for a specific activity
     */
    calculateActivityStreak(attempts) {
        return this.calculateStreaks(attempts).currentStreak;
    }
    // ========================================================================
    // DATA MANAGEMENT
    // ========================================================================
    /**
     * Clear all stored data (for testing/reset).
     * Cloud-only mode: backend delete endpoint is not implemented.
     */
    async clearAllData() {
        console.warn('clearAllData is not available in cloud-only mode (no delete endpoint)');
    }
    /**
     * Generate sample data for demonstration purposes.
     * Cloud-only mode: disabled to avoid local writes.
     */
    async generateDemoData() {
        console.warn('generateDemoData is disabled in cloud-only mode');
    }
}
// ============================================================================
// SINGLETON EXPORT
// ============================================================================
export const SessionTracker = new SessionTrackerService();
