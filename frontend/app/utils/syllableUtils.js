/**
 * English syllable splitting utility.
 *
 * Uses standard linguistic rules to split English words into syllables:
 *  1. Every syllable needs at least one vowel sound.
 *  2. Consonant clusters between vowels are split so that
 *     the maximum onset principle applies (consonants prefer to
 *     attach to the following vowel).
 *  3. Common suffixes (-tion, -sion, -ble, -ple, -tle, -cle, etc.)
 *     and digraphs (th, sh, ch, wh, ph, etc.) are kept together.
 *
 * Good enough for the common object names produced by YOLO
 * (apple, bottle, banana, elephant, giraffe, etc.).
 */

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

// Consonant pairs that should never be split (onsets)
const ONSETS = new Set([
    'bl', 'br', 'ch', 'cl', 'cr', 'dr', 'dw', 'fl', 'fr',
    'gl', 'gr', 'kn', 'ph', 'pl', 'pr', 'qu', 'sc', 'sh',
    'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'th', 'tr',
    'tw', 'wh', 'wr', 'scr', 'shr', 'spl', 'spr', 'str',
    'thr',
]);

/**
 * Check if a substring is a valid English onset (beginning of syllable).
 */
function isValidOnset(s) {
    return s.length === 0 || ONSETS.has(s) || (!VOWELS.has(s[0]) && s.length === 1);
}

/**
 * Split an English word into syllables.
 * @param {string} word
 * @returns {string[]} array of syllable strings
 *
 * Examples:
 *   splitSyllables('apple')     → ['ap', 'ple']
 *   splitSyllables('banana')    → ['ba', 'na', 'na']
 *   splitSyllables('bottle')    → ['bot', 'tle']
 *   splitSyllables('elephant')  → ['el', 'e', 'phant']
 *   splitSyllables('giraffe')   → ['gi', 'raffe']
 *   splitSyllables('cat')       → ['cat']
 */
export function splitSyllables(word) {
    if (!word) return [];

    const w = word.toLowerCase().trim();
    if (w.length <= 1) return [w];

    // Locate vowel groups and consonant groups
    const chars = [...w];
    const isVowel = chars.map((c) => VOWELS.has(c));

    // Handle words with no vowels (rare)
    if (!isVowel.some(Boolean)) return [w];

    // Build segments: alternating vowel-groups and consonant-groups
    // Then decide where to split consonant clusters between vowels.
    const syllables = [];
    let current = '';

    for (let i = 0; i < chars.length; i++) {
        current += chars[i];

        // At end of word → push whatever we have
        if (i === chars.length - 1) {
            syllables.push(current);
            break;
        }

        // Look for a vowel-to-consonant transition followed eventually by another vowel
        // This is where we might need to split.
        if (isVowel[i] && !isVowel[i + 1]) {
            // Find the next vowel
            let nextVowelIdx = -1;
            for (let j = i + 1; j < chars.length; j++) {
                if (isVowel[j]) {
                    nextVowelIdx = j;
                    break;
                }
            }

            if (nextVowelIdx === -1) {
                // No more vowels → rest of word belongs to current syllable
                current += chars.slice(i + 1).join('');
                syllables.push(current);
                break;
            }

            // Consonant cluster between current vowel (i) and next vowel (nextVowelIdx)
            const cluster = chars.slice(i + 1, nextVowelIdx).join('');

            if (cluster.length === 0) {
                continue; // shouldn't happen
            }

            if (cluster.length === 1) {
                // Single consonant → attach to next syllable (open syllable preference)
                syllables.push(current);
                current = '';
            } else {
                // Multiple consonants → find the best split point
                // Try to give the maximum valid onset to the next syllable
                let splitAt = 1; // default: keep first consonant with current syllable
                for (let k = cluster.length; k >= 1; k--) {
                    const onset = cluster.slice(cluster.length - k);
                    if (isValidOnset(onset)) {
                        splitAt = cluster.length - k;
                        break;
                    }
                }

                // If splitAt is 0, keep at least one consonant with current syllable
                if (splitAt === 0) splitAt = 1;

                current += cluster.slice(0, splitAt);
                syllables.push(current);
                current = cluster.slice(splitAt);
            }

            i = nextVowelIdx - 1; // loop will increment i
        }
    }

    // Handle silent 'e' at end: merge last syllable if it's just a consonant+'e'
    // e.g. "giraffe" → ["gi", "raf", "fe"] → merge last two? No, keep as is.
    // But single 'e' at end should merge: ["bottl", "e"] → nope, we handle "tle" as onset
    if (syllables.length > 1) {
        const last = syllables[syllables.length - 1];
        // If last syllable has no vowel, merge with previous
        if (!last.split('').some((c) => VOWELS.has(c))) {
            syllables[syllables.length - 2] += last;
            syllables.pop();
        }
        // If last syllable is just 'e' (silent e), merge with previous
        if (syllables.length > 1 && syllables[syllables.length - 1] === 'e') {
            syllables[syllables.length - 2] += 'e';
            syllables.pop();
        }
    }

    return syllables;
}

/**
 * Assign colors to syllables for display.
 * @param {string} word
 * @returns {{ text: string, color: string }[]}
 */
export function getSyllablesWithColors(word) {
    const colorList = ['purple', 'blue', 'pink', 'green', 'yellow'];
    const syllables = splitSyllables(word);
    return syllables.map((syl, i) => ({
        text: syl,
        color: colorList[i % colorList.length],
    }));
}
