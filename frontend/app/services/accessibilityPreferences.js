import { getStorage } from './storageAdapter';

const ACCESSIBILITY_KEY = '@dyslexia_accessibility_preferences';

export const DEFAULT_ACCESSIBILITY_PREFERENCES = {
    textSize: 'medium',
    fontStyle: 'opendyslexic',
};

export const getAccessibilityPreferences = async () => {
    try {
        const storage = await getStorage();
        const raw = await storage.getItem(ACCESSIBILITY_KEY);
        if (!raw) {
            return DEFAULT_ACCESSIBILITY_PREFERENCES;
        }

        const parsed = JSON.parse(raw);
        return {
            textSize: parsed?.textSize || DEFAULT_ACCESSIBILITY_PREFERENCES.textSize,
            fontStyle: parsed?.fontStyle || DEFAULT_ACCESSIBILITY_PREFERENCES.fontStyle,
        };
    } catch {
        return DEFAULT_ACCESSIBILITY_PREFERENCES;
    }
};

export const saveAccessibilityPreferences = async (preferences) => {
    const storage = await getStorage();
    await storage.setItem(
        ACCESSIBILITY_KEY,
        JSON.stringify({
            textSize: preferences?.textSize || DEFAULT_ACCESSIBILITY_PREFERENCES.textSize,
            fontStyle: preferences?.fontStyle || DEFAULT_ACCESSIBILITY_PREFERENCES.fontStyle,
        })
    );
};
