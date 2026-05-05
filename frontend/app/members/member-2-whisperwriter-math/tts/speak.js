/**
 * ================================================================================
 * TEXT-TO-SPEECH (TTS) SERVICE
 * ================================================================================
 *
 * Wraps `expo-speech` with dyslexia-friendly settings for the Writing & Math module.
 *
 * DYSLEXIA ADJUSTMENTS:
 * ---------------------
 * - rate: 0.8  → Slightly slower than normal speech so children can follow
 * - pitch: 1.0 → Natural pitch (no distortion)
 * - language: 'en' → English
 *
 * USAGE:
 * ------
 *   import { speak, stopSpeaking } from '../tts/speak';
 *
 *   // Announce a letter
 *   speak('Draw the letter A');
 *
 *   // Stop any ongoing speech (e.g. on screen unmount)
 *   stopSpeaking();
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import * as Speech from 'expo-speech';

/**
 * Speak the given text aloud using device TTS.
 *
 * @param text - The string to read out (e.g. "How many letters are in CAT?")
 */
export const speak = (text) => {
    Speech.speak(text, {
        rate: 0.8,      // Slower rate for children — easier to understand
        pitch: 1.0,     // Natural pitch
        language: 'en', // English
    });
};

/**
 * Stop any currently playing TTS immediately.
 * Call this when navigating away from a screen to avoid speech continuing.
 */
export const stopSpeaking = () => {
    Speech.stop();
};
