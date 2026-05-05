/**
 * ================================================================================
 * API BASE URL MANAGER
 * ================================================================================
 *
 * Manages the base URL for the Writing & Math module's backend server.
 * The active URL is resolved at startup from the shared apiHub service and
 * can be updated at runtime if the health check discovers a better candidate.
 *
 * USAGE:
 * ------
 *   import { getApiBaseUrl, setApiBaseUrl, getApiHost } from './apiBaseUrl';
 *
 *   // Get current base URL (e.g. "https://my-space.hf.space")
 *   const baseUrl = getApiBaseUrl();
 *
 *   // Update URL after health check discovers the correct host
 *   setApiBaseUrl('https://new-host.hf.space');
 *
 *   // Get just the hostname (used by TfliteLetterScreen IP input)
 *   const host = getApiHost();
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import { getBackendUrl } from '../../../services/apiHub';

/** Remove any trailing slashes from a URL */
const stripTrailingSlash = (url) => url.replace(/\/+$/, '');

/** Active base URL — initialised from the shared apiHub at module load */
let activeBaseUrl = stripTrailingSlash(getBackendUrl('writingMath'));

/**
 * Get the current active backend base URL.
 * All API calls should use this to build endpoint URLs.
 *
 * @returns Current base URL string (no trailing slash)
 */
export const getApiBaseUrl = () => activeBaseUrl;

/**
 * Override the active backend base URL.
 * Called by the health-check function when it discovers which candidate URL is live.
 *
 * @param url - New base URL to use (trailing slashes are stripped automatically)
 */
export const setApiBaseUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return;
    }
    const trimmed = stripTrailingSlash(url.trim());
    if (trimmed.length > 0) {
        activeBaseUrl = trimmed;
    }
};

/**
 * Get the list of candidate base URLs to try during health checks.
 * Currently returns only the primary URL from apiHub.
 *
 * @returns Array of base URL strings to attempt
 */
export const getApiBaseUrlCandidates = () => [
    stripTrailingSlash(getBackendUrl('writingMath'))
];

/**
 * Get just the hostname portion of the active base URL.
 * Used by TfliteLetterScreen to pre-fill the server IP input field.
 *
 * @returns Hostname string, or the full URL if parsing fails
 */
export const getApiHost = () => {
    try {
        return new URL(activeBaseUrl).hostname;
    } catch {
        return activeBaseUrl;
    }
};
