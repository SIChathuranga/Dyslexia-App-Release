import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';

const WORDS = [
    { word: "DOG", letters: ["G", "O", "D"] },
    { word: "CAT", letters: ["A", "T", "C"] },
    { word: "SUN", letters: ["N", "U", "S"] },
    { word: "BIG", letters: ["I", "G", "B"] }
];

export default function WordBuilderScreen() {
    const [level, setLevel] = useState(0);
    const [scrambled, setScrambled] = useState([]);
    const [userWord, setUserWord] = useState([]);
    const [feedback, setFeedback] = useState('Spell the word!');

    // Get current word data
    const target = WORDS[level] ? WORDS[level].word : "";

    useEffect(() => {
        if (level < WORDS.length) {
            // Create objects with unique IDs for handling duplicate letters if needed
            setScrambled(WORDS[level].letters.map((l, i) => ({ id: i, char: l })));
            setUserWord([]);
            setFeedback(`Spell: ${WORDS[level].word}`);
            setTimeout(() => speak(`Spell the word ${WORDS[level].word}`), 500);
        } else {
            setFeedback("All words completed! Great Job!");
            speak("All words completed! Great Job!");
        }
    }, [level]);

    const speak = (text) => {
        Speech.speak(text);
    };

    const handleSelectLetter = (item) => {
        // Move from scrambled to userWord
        const newScrambled = scrambled.filter(l => l.id !== item.id);
        const newUserWord = [...userWord, item];

        setScrambled(newScrambled);
        setUserWord(newUserWord);
        speak(item.char);

        // Check if word is complete
        if (newScrambled.length === 0) {
            const formedWord = newUserWord.map(l => l.char).join("");
            if (formedWord === target) {
                setFeedback("Correct! ✨");
                speak("Correct!");
                setTimeout(() => {
                    setLevel(level + 1);
                }, 1200);
            } else {
                setFeedback("Oops! Try again.");
                speak("Try again.");
                setTimeout(() => {
                    // Reset this level
                    setScrambled(WORDS[level].letters.map((l, i) => ({ id: i, char: l })));
                    setUserWord([]);
                }, 1500);
            }
        }
    };

    const handleReturnLetter = (item) => {
        // Move from userWord back to scrambled
        const newUserWord = userWord.filter(l => l.id !== item.id);
        const newScrambled = [...scrambled, item];

        setUserWord(newUserWord);
        setScrambled(newScrambled);
    };

    if (level >= WORDS.length) {
        return (
            <View style={styles.container}>
                <Text style={styles.feedback}>{feedback}</Text>
                <TouchableOpacity style={styles.button} onPress={() => setLevel(0)}>
                    <Text style={styles.buttonText}>Play Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Word Builder</Text>
            <TouchableOpacity onPress={() => speak(target)}>
                <Text style={styles.subHeader}>Make the word: <Text style={styles.target}>{target}</Text> 🔊</Text>
            </TouchableOpacity>

            <View style={styles.slotContainer}>
                {/* Placeholder slots for the word length */}
                {Array(target.length).fill(0).map((_, i) => (
                    <View key={i} style={styles.slotPlaceholder}>
                        {userWord[i] ? (
                            <TouchableOpacity style={styles.letterTile} onPress={() => handleReturnLetter(userWord[i])}>
                                <Text style={styles.letter}>{userWord[i].char}</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                ))}
            </View>

            <View style={styles.poolContainer}>
                {scrambled.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.letterTile} onPress={() => handleSelectLetter(item)}>
                        <Text style={styles.letter}>{item.char}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.feedback}>{feedback}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E8F5E9', padding: 20, alignItems: 'center', paddingTop: 60 },
    header: { fontSize: 30, fontWeight: 'bold', color: '#1B5E20', marginBottom: 10 },
    subHeader: { fontSize: 20, color: '#333', marginBottom: 40 },
    target: { fontWeight: 'bold', color: '#2E7D32' },
    slotContainer: { flexDirection: 'row', gap: 10, marginBottom: 50, height: 70 },
    slotPlaceholder: {
        width: 60, height: 60,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderBottomWidth: 3,
        borderColor: '#4CAF50',
        justifyContent: 'center', alignItems: 'center'
    },
    poolContainer: { flexDirection: 'row', gap: 15, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 30 },
    letterTile: {
        width: 60, height: 60,
        backgroundColor: '#fff',
        borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        elevation: 5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2
    },
    letter: { fontSize: 32, fontWeight: 'bold', color: '#1B5E20' },
    feedback: { fontSize: 22, color: '#2E7D32', fontWeight: 'bold' },
    button: {
        marginTop: 20, backgroundColor: '#1B5E20', padding: 15, borderRadius: 10
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
