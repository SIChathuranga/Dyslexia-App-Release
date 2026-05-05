import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';

const GAME_DATA = [
    { word: "Cat", sound: "/k/ - Cat", correct: "🐱", options: ["🐱", "🐶", "🚗"] },
    { word: "Car", sound: "/k/ - Car", correct: "🚗", options: ["🍎", "🚗", "✈️"] },
    { word: "Dog", sound: "/d/ - Dog", correct: "🐶", options: ["🐶", "🦊", "🐻"] },
    { word: "Apple", sound: "/a/ - Apple", correct: "🍎", options: ["🍌", "🍇", "🍎"] }
];

export default function SoundPictureMatchScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [feedback, setFeedback] = useState('Tap the picture that matches the sound!');
    const [attempts, setAttempts] = useState(0);

    const currentItem = GAME_DATA[currentIndex];

    useEffect(() => {
        if (currentItem) {
            setTimeout(() => speakWord(), 500);
        }
    }, [currentIndex]);

    const speakWord = () => {
        if (currentItem) {
            Speech.speak(currentItem.word);
        }
    };

    const handlePress = (item) => {
        if (item === currentItem.correct) {
            setFeedback('Correct! 🌟');
            Speech.speak("Correct!");
            setTimeout(() => {
                if (currentIndex < GAME_DATA.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                    setFeedback('Next one!');
                } else {
                    setFeedback('All Done! You won! 🎉');
                    Speech.speak("All done! You won!");
                }
            }, 1500);
        } else {
            setFeedback('Try Again! 🤔');
            Speech.speak("Try again.");
        }
        setAttempts(attempts + 1);
    };

    const restart = () => {
        setCurrentIndex(0);
        setFeedback('Tap the picture that matches the sound!');
        setAttempts(0);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Match sound to picture</Text>

            <TouchableOpacity style={styles.soundBox} onPress={speakWord}>
                <Text style={styles.speaker}>🔊</Text>
                <Text style={styles.soundText}>{currentItem ? currentItem.word : "Done!"}</Text>
                <Text style={styles.instruction}>(Tap to listen)</Text>
            </TouchableOpacity>

            <Text style={styles.feedback}>{feedback}</Text>

            {currentItem && (
                <View style={styles.grid}>
                    {currentItem.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.card}
                            onPress={() => handlePress(option)}
                        >
                            <Text style={styles.emoji}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {!currentItem && (
                <TouchableOpacity style={[styles.card, { marginTop: 20, backgroundColor: '#AED581' }]} onPress={restart}>
                    <Text style={styles.restartText}>Play Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF3E0', padding: 20, alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', color: '#E65100', marginBottom: 20 },
    soundBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 20,
        width: '80%',
        elevation: 2
    },
    speaker: { fontSize: 40, marginBottom: 10 },
    soundText: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    instruction: { fontSize: 14, color: '#777', marginTop: 5 },
    feedback: { fontSize: 20, color: '#FF6F00', marginBottom: 30, textAlign: 'center' },
    grid: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
    card: {
        width: 100,
        height: 100,
        backgroundColor: '#fff',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4
    },
    emoji: { fontSize: 50 },
    restartText: { fontSize: 20, fontWeight: 'bold', color: '#fff' }
});
