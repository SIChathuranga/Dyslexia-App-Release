import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';

export default function VisualSequenceScreen() {
    const [sequence, setSequence] = useState([]);
    const [userSequence, setUserSequence] = useState([]);
    const [showingSequence, setShowingSequence] = useState(false);
    const [message, setMessage] = useState('Watch sequence...');
    const [level, setLevel] = useState(1);
    const [activeHighlight, setActiveHighlight] = useState(null);

    const colors = [
        { id: 'red', color: '#FF5252' },
        { id: 'blue', color: '#448AFF' },
        { id: 'green', color: '#69F0AE' },
        { id: 'yellow', color: '#FFD740' }
    ];

    useEffect(() => {
        startLevel();
    }, [level]);

    const speak = (text) => {
        Speech.speak(text);
    };

    const startLevel = () => {
        setUserSequence([]);
        setMessage(`Level ${level}: Watch closely!`);
        speak(`Level ${level}, watch closely!`);
        setShowingSequence(true);

        // Generate sequence based on level
        const newSequence = [];
        for (let i = 0; i < level + 2; i++) {
            newSequence.push(colors[Math.floor(Math.random() * colors.length)].id);
        }
        setSequence(newSequence);
        playSequence(newSequence);
    };

    const playSequence = (seq) => {
        let i = 0;
        const interval = setInterval(() => {
            if (i >= seq.length) {
                clearInterval(interval);
                setActiveHighlight(null);
                setShowingSequence(false);
                setMessage('Now repeat the sequence!');
                speak('Now repeat!');
                return;
            }
            setActiveHighlight(seq[i]);
            setTimeout(() => setActiveHighlight(null), 500);
            i++;
        }, 1000);
    };

    const handlePress = (colorId) => {
        if (showingSequence) return;

        const nextIndex = userSequence.length;
        if (colorId !== sequence[nextIndex]) {
            setMessage('Wrong! Try again.');
            speak('Wrong! Try again.');
            setTimeout(() => {
                setLevel(1);
            }, 1500);
            return;
        }

        const newUserSequence = [...userSequence, colorId];
        setUserSequence(newUserSequence);

        if (newUserSequence.length === sequence.length) {
            setMessage('Correct! Next level...');
            speak('Correct! Next level.');
            setTimeout(() => setLevel(level + 1), 1500);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{message}</Text>

            <View style={styles.grid}>
                {colors.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.box,
                            { backgroundColor: item.color },
                            activeHighlight === item.id && styles.highlight,
                            showingSequence && activeHighlight !== item.id && styles.dimmed
                        ]}
                        onPress={() => handlePress(item.id)}
                        disabled={showingSequence}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3E5F5' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40, color: '#4A148C' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', width: 300, justifyContent: 'center', gap: 20 },
    box: {
        width: 120,
        height: 120,
        borderRadius: 15,
        elevation: 4,
    },
    highlight: {
        borderWidth: 4,
        borderColor: '#fff',
        transform: [{ scale: 1.1 }]
    },
    dimmed: {
        opacity: 0.5
    }
});
