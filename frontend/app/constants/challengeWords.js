export const CHALLENGE_WORD_POOL = [
    'Apple',
    'Backpack',
    'Ball',
    'Banana',
    'Bicycle',
    'Book',
    'Bottle',
    'Car',
    'Cat',
    'Chair',
    'Clock',
    'Coffee',
    'Dog',
    'Fork',
    'Handbag',
    'Houseplant',
    'Laptop',
    'Orange',
    'Pen',
    'Person',
    'Scissors',
    'Spoon',
    'Table',
];

const buildDateSeed = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return Number(`${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`);
};

const createSeededRandom = (seed) => {
    let nextSeed = seed;

    return () => {
        nextSeed += 0x6D2B79F5;
        let t = nextSeed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const shuffleWords = (words, random) => {
    const nextWords = [...words];

    for (let index = nextWords.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [nextWords[index], nextWords[swapIndex]] = [nextWords[swapIndex], nextWords[index]];
    }

    return nextWords;
};

export const getTodaysChallengeWords = (count = 4, date = new Date()) => {
    const random = createSeededRandom(buildDateSeed(date));
    return shuffleWords(CHALLENGE_WORD_POOL, random).slice(0, count);
};

export const normalizeChallengeLabel = (value = '') =>
    String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
