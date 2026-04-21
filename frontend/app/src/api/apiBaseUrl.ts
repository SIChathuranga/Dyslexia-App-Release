import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const BACKEND_PORT = '5000';

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

const parseHostFromUrl = (value: string | null | undefined): string | null => {
    if (!value) {
        return null;
    }

    try {
        const normalized = value.includes('://') ? value : `http://${value}`;
        const parsed = new URL(normalized);
        return parsed.hostname || null;
    } catch {
        return null;
    }
};

const parseHostFromHostUri = (value: string | null | undefined): string | null => {
    if (!value) {
        return null;
    }
    const withoutProtocol = value.replace(/^[a-z]+:\/\//i, '');
    return withoutProtocol.split(':')[0] || null;
};

const getHostFromExpoConstants = (): string | null => {
    const fromExpoConfig = parseHostFromHostUri(Constants.expoConfig?.hostUri);
    if (fromExpoConfig) {
        return fromExpoConfig;
    }

    const manifest2HostUri =
        (Constants as any)?.manifest2?.extra?.expoClient?.hostUri as string | undefined;
    const fromManifest2 = parseHostFromHostUri(manifest2HostUri);
    if (fromManifest2) {
        return fromManifest2;
    }

    const debuggerHost = (Constants as any)?.manifest?.debuggerHost as string | undefined;
    return parseHostFromHostUri(debuggerHost);
};

const getHostFromScriptURL = (): string | null => {
    const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
    return parseHostFromUrl(scriptURL);
};

const getHostFromWebLocation = (): string | null => {
    if (Platform.OS !== 'web') {
        return null;
    }

    const hostname = globalThis?.location?.hostname;
    return typeof hostname === 'string' && hostname.length > 0 ? hostname : null;
};

const getDefaultHostForPlatform = (): string => {
    if (Platform.OS === 'android') {
        return '10.0.2.2';
    }
    return 'localhost';
};

const normalizeHostForPlatform = (host: string): string => {
    const isAndroid = Platform.OS === 'android';
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

    if (isAndroid && isLocalHost) {
        return '10.0.2.2';
    }

    return host;
};

const toBaseUrl = (host: string): string => {
    const normalizedHost = normalizeHostForPlatform(host);
    const safeHost = normalizedHost.includes(':') ? `[${normalizedHost}]` : normalizedHost;
    return `http://${safeHost}:${BACKEND_PORT}`;
};

// Uses the same env variable as apiHub.js — set in .env file
const envBaseUrl = process.env.EXPO_PUBLIC_WRITING_MATH_API_URL?.trim()
    || process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const envHost = process.env.EXPO_PUBLIC_API_HOST?.trim();

const candidateHosts = [
    parseHostFromUrl(envHost),
    parseHostFromUrl(envBaseUrl),
    getHostFromExpoConstants(),
    getHostFromScriptURL(),
    getHostFromWebLocation(),
    getDefaultHostForPlatform(),
    'localhost',
    '127.0.0.1',
    '10.0.2.2',
];

const candidateBaseUrls = [
    envBaseUrl ? stripTrailingSlash(envBaseUrl) : null,
    ...candidateHosts
        .filter((host): host is string => Boolean(host))
        .map((host) => toBaseUrl(host)),
].filter((url): url is string => Boolean(url));

const dedupedBaseUrls = Array.from(new Set(candidateBaseUrls));

let activeBaseUrl = dedupedBaseUrls[0] ?? toBaseUrl(getDefaultHostForPlatform());

export const getApiBaseUrl = (): string => activeBaseUrl;

export const setApiBaseUrl = (url: string): void => {
    const trimmed = stripTrailingSlash(url.trim());
    if (trimmed.length > 0) {
        activeBaseUrl = trimmed;
    }
};

export const getApiBaseUrlCandidates = (): string[] => dedupedBaseUrls;

export const getApiHost = (): string => {
    try {
        return new URL(activeBaseUrl).hostname;
    } catch {
        return activeBaseUrl;
    }
};

