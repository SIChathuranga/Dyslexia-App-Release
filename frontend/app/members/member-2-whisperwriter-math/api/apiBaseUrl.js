import { getBackendUrl } from '../../../services/apiHub';

const stripTrailingSlash = (url) => url.replace(/\/+$/, '');

let activeBaseUrl = stripTrailingSlash(getBackendUrl('writingMath'));

export const getApiBaseUrl = () => activeBaseUrl;

export const setApiBaseUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return;
  }

  const trimmed = stripTrailingSlash(url.trim());
  if (trimmed.length > 0) {
    activeBaseUrl = trimmed;
  }
};

export const getApiBaseUrlCandidates = () => [stripTrailingSlash(getBackendUrl('writingMath'))];

export const getApiHost = () => {
  try {
    return new URL(activeBaseUrl).hostname;
  } catch {
    return activeBaseUrl;
  }
};
