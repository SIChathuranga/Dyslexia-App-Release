import { getStorage } from './storageAdapter';

const SESSION_KEY = '@dyslexia_auth_session';

export const isSessionValid = (session) => {
    if (!session?.token || !session?.user) {
        return false;
    }

    if (!session.expiresAt) {
        return true;
    }

    return Number(session.expiresAt) > Date.now();
};

export const saveAuthSession = async (session) => {
    const storage = await getStorage();
    await storage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getAuthSession = async () => {
    try {
        const storage = await getStorage();
        const raw = await storage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const clearAuthSession = async () => {
    const storage = await getStorage();
    await storage.removeItem(SESSION_KEY);
};
