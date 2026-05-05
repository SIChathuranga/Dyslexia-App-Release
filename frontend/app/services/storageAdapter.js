import { Platform } from 'react-native';

const STORAGE_FILENAME = 'dyslexia_storage.json';
let cachedStorage = null;
const memoryStore = {};

const memoryStorage = {
    getItem: async (key) => memoryStore[key] ?? null,
    setItem: async (key, value) => {
        memoryStore[key] = value;
    },
    removeItem: async (key) => {
        delete memoryStore[key];
    },
};

const webStorage = {
    getItem: async (key) => {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: async (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Ignore storage quota / privacy mode errors and keep app responsive.
        }
    },
    removeItem: async (key) => {
        try {
            localStorage.removeItem(key);
        } catch {
            // Ignore failures.
        }
    },
};

const buildFileStorage = async () => {
    try {
        const fsModule = await import('expo-file-system');
        const FileSystem = fsModule.default ?? fsModule;
        const documentDirectory = FileSystem.documentDirectory;

        if (!documentDirectory || !FileSystem.readAsStringAsync || !FileSystem.writeAsStringAsync) {
            return null;
        }

        const storagePath = `${documentDirectory}${STORAGE_FILENAME}`;

        const readStore = async () => {
            try {
                const info = await FileSystem.getInfoAsync(storagePath);
                if (!info.exists) {
                    return {};
                }

                const raw = await FileSystem.readAsStringAsync(storagePath);
                return raw ? JSON.parse(raw) : {};
            } catch {
                return {};
            }
        };

        const writeStore = async (data) => {
            await FileSystem.writeAsStringAsync(storagePath, JSON.stringify(data));
        };

        return {
            getItem: async (key) => {
                const store = await readStore();
                return store[key] ?? null;
            },
            setItem: async (key, value) => {
                const store = await readStore();
                store[key] = value;
                await writeStore(store);
            },
            removeItem: async (key) => {
                const store = await readStore();
                delete store[key];
                await writeStore(store);
            },
        };
    } catch {
        return null;
    }
};

export const getStorage = async () => {
    if (cachedStorage) {
        return cachedStorage;
    }

    if (Platform.OS === 'web') {
        cachedStorage = webStorage;
        return cachedStorage;
    }

    try {
        const mod = await import('@react-native-async-storage/async-storage');
        if (mod?.default) {
            cachedStorage = mod.default;
            return cachedStorage;
        }
    } catch {
        // Ignore and fall back to a file-based implementation.
    }

    const fileStorage = await buildFileStorage();
    if (fileStorage) {
        cachedStorage = fileStorage;
        return cachedStorage;
    }

    console.warn('Persistent storage unavailable. Falling back to in-memory storage.');
    cachedStorage = memoryStorage;
    return cachedStorage;
};
