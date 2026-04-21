/**
 * ================================================================================
 * DATA SYNC SERVICE
 * ================================================================================
 * 
 * Handles syncing progress data directly to MongoDB Atlas via the Flask backend.
 *
 * DESIGN: Cloud-Only
 * ------------------
 * 1. Data is sent directly to backend endpoints
 * 2. No local filesystem persistence is used
 * 3. Analytics are fetched from cloud data
 * 
 * USAGE:
 * ------
 *   import { DataSyncService } from './DataSyncService';
 * 
 *   // Set patient ID (once, on app start or login)
 *   await DataSyncService.setPatientId('patient_001');
 * 
 *   // Sync an attempt (fire-and-forget, non-blocking)
 *   DataSyncService.syncAttempt(attemptData);
 * 
 *   // Sync a session
 *   DataSyncService.syncSession(sessionData);
 * 
 *   // Flush offline queue when back online
 *   await DataSyncService.processSyncQueue();
 * 
 * Author: Research Team 25-26J-333
 * ================================================================================
 */

import { getApiBaseUrl } from '../api/apiBaseUrl';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Timeout for API calls (ms) */
const API_TIMEOUT_MS = 10000;

/**
 * Fetch with timeout support
 */
const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
};

// ============================================================================
// DATA SYNC SERVICE CLASS
// ============================================================================

class DataSyncServiceClass {
    private patientId: string = 'default_patient';

    // ========================================================================
    // PATIENT ID MANAGEMENT
    // ========================================================================

    /**
     * Set the current patient ID.
     * This ID links all data across the 4 research components.
     */
    async setPatientId(id: string): Promise<void> {
        this.patientId = id;
    }

    /**
     * Get the current patient ID.
     * Uses in-memory value only (cloud-only mode).
     */
    async getPatientId(): Promise<string> {
        return this.patientId;
    }

    // ========================================================================
    // SYNC OPERATIONS (Fire-and-Forget)
    // ========================================================================

    /**
    * Sync a single attempt to the cloud.
     * 
     * @param attempt - The attempt record from SessionTracker
    * @returns true if synced successfully, false otherwise
     */
    async syncAttempt(attempt: any): Promise<boolean> {
        const patientId = await this.getPatientId();
        const payload = { ...attempt, patientId };

        try {
            const response = await fetchWithTimeout(
                `${getApiBaseUrl()}/api/data/attempts`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                console.warn('[DataSync] Backend returned error for attempt:', response.status);
                return false;
            }

            return true;
        } catch (error) {
            console.warn('[DataSync] Attempt sync failed:', error);
            return false;
        }
    }

    /**
    * Sync a session summary to the cloud.
     * 
     * @param session - The session summary from SessionTracker
    * @returns true if synced successfully, false otherwise
     */
    async syncSession(session: any): Promise<boolean> {
        const patientId = await this.getPatientId();
        const payload = { ...session, patientId };

        try {
            const response = await fetchWithTimeout(
                `${getApiBaseUrl()}/api/data/sessions`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                console.warn('[DataSync] Backend returned error for session:', response.status);
                return false;
            }

            return true;
        } catch (error) {
            console.warn('[DataSync] Session sync failed:', error);
            return false;
        }
    }

    // ========================================================================
    // OFFLINE QUEUE MANAGEMENT
    // ========================================================================

    /**
     * Process sync queue.
     * Cloud-only mode: no local queue is maintained.
     * 
     * @returns Object with count of synced and failed items
     */
    async processSyncQueue(): Promise<{ synced: number; failed: number }> {
        return { synced: 0, failed: 0 };
    }

    /**
     * Get the number of items waiting in the sync queue.
     */
    async getQueueSize(): Promise<number> {
        return 0;
    }

    // ========================================================================
    // CLOUD DATA RETRIEVAL
    // ========================================================================

    /**
     * Fetch patient summary from the cloud.
     * Useful for cross-device access or parent dashboards.
     */
    async fetchCloudSummary(): Promise<Record<string, unknown> | null> {
        const patientId = await this.getPatientId();

        try {
            const response = await fetchWithTimeout(
                `${getApiBaseUrl()}/api/data/summary/${patientId}`,
                { method: 'GET' }
            );
            if (response.ok) return await response.json();
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Fetch patient attempts from the cloud.
     */
    async fetchCloudAttempts(
        activity?: string,
        limit: number = 500
    ): Promise<any[]> {
        const patientId = await this.getPatientId();
        const params = new URLSearchParams();
        if (activity) params.set('activity', activity);
        params.set('limit', limit.toString());

        try {
            const response = await fetchWithTimeout(
                `${getApiBaseUrl()}/api/data/attempts/${patientId}?${params}`,
                { method: 'GET' }
            );
            if (response.ok) {
                const data = await response.json();
                return data.attempts || [];
            }
            return [];
        } catch {
            return [];
        }
    }

    /**
     * Fetch patient sessions from the cloud.
     */
    async fetchCloudSessions(limit: number = 500): Promise<any[]> {
        const patientId = await this.getPatientId();
        const params = new URLSearchParams();
        params.set('limit', limit.toString());

        try {
            const response = await fetchWithTimeout(
                `${getApiBaseUrl()}/api/data/sessions/${patientId}?${params}`,
                { method: 'GET' }
            );
            if (response.ok) {
                const data = await response.json();
                return data.sessions || [];
            }
            return [];
        } catch {
            return [];
        }
    }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const DataSyncService = new DataSyncServiceClass();
