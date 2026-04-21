import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';

export default function PhonemePopScreen() {
    const [feedback, setFeedback] = useState('Tap the letter that makes the sound!');
    const [score, setScore] = useState(0);
    const [target, setTarget] = useState('B');
    const [options, setOptions] = useState(['D', 'P', 'B', 'Q']);

    useEffect(() => {
        startNewRound();
    }, []);

    const speak = (text) => {
        Speech.speak(text);
    };

    const startNewRound = () => {
        const letters = ['B', 'D', 'P', 'Q', 'M', 'N'];
        const newTarget = letters[Math.floor(Math.random() * letters.length)];
        // Generate 3 random distractors
        const distractors = letters.filter(l => l !== newTarget).sort(() => 0.5 - Math.random()).slice(0, 3);
        const newOptions = [newTarget, ...distractors].sort(() => 0.5 - Math.random());

        setTarget(newTarget);
        setOptions(newOptions);
        setFeedback('Tap the letter that matches the sound!');

        // Speak the prompt
        setTimeout(() => {
            speak(`Find the letter that makes the sound ${newTarget}`);
        }, 500);
    };

    const handlePress = (letter) => {
        if (letter === target) {
            setFeedback('Correct! Great Job! 🎉');
            speak("Correct! Good job!");
            setScore(score + 1);
            setTimeout(startNewRound, 1500);
        } else {
            setFeedback('Try Again! Listen carefully.');
            speak("Try again.");
        }
    };

    const repeatSound = () => {
        speak(`The sound is ${target}`);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.score}>Score: {score}</Text>
            </View>

            <TouchableOpacity style={styles.promptContainer} onPress={repeatSound}>
                <Text style={styles.speakerIcon}>🔊</Text>
                <Text style={styles.promptText}>Tap to hear sound</Text>
                <Text style={styles.subText}>(Target: {target})</Text>
            </TouchableOpacity>

            <Text style={styles.feedback}>{feedback}</Text>

            <View style={styles.bubblesContainer}>
                {options.map((letter, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.bubble}
                        onPress={() => handlePress(letter)}
                    >
                        <Text style={styles.letter}>{letter}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E0F7FA', padding: 20, alignItems: 'center' },
    header: { width: '100%', alignItems: 'flex-end', marginBottom: 20 },
    score: { fontSize: 20, fontWeight: 'bold', color: '#006064' },
    promptContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 30,
        elevation: 4
    },
    speakerIcon: { fontSize: 40, marginBottom: 10 },
    promptText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subText: { fontSize: 16, color: '#666', marginTop: 5 },
    feedback: { fontSize: 18, color: '#00838F', marginBottom: 30, fontWeight: '600' },
    bubblesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20
    },
    bubble: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4DD0E1',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        margin: 10
    },
    letter: { fontSize: 36, fontWeight: 'bold', color: '#fff' }
});
