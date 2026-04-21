import * as Speech from 'expo-speech';

export const speak = (text: string) => {
    Speech.speak(text, {
        rate: 0.8, // Slower rate for children
        pitch: 1.0,
        language: 'en',
    });
};

export const stopSpeaking = () => {
    Speech.stop();
}
