import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { fonts } from '../../theme';

const PhonemeSegment = ({ phoneme, color, isCorrect, index }) => {
    const colorStyles = {
        purple: { bg: '#E9D8FD', text: '#553C9A', border: '#D6BCFA' },
        blue: { bg: '#BEE3F8', text: '#2A4365', border: '#90CDF4' },
        green: { bg: '#C6F6D5', text: '#22543D', border: '#9AE6B4' },
        pink: { bg: '#FED7E2', text: '#702459', border: '#FBB6CE' },
        yellow: { bg: '#FEFCBF', text: '#744210', border: '#FAF089' },
        orange: { bg: '#FEEBC8', text: '#7B341E', border: '#FBD38D' },
    };

    const colorStyle = colorStyles[color] || colorStyles.purple;

    return (
        <View style={[
            styles.container,
            { backgroundColor: colorStyle.bg, borderColor: colorStyle.border },
            isCorrect === true && styles.correct,
            isCorrect === false && styles.incorrect,
        ]}>
            <Text style={[
                styles.text,
                { color: colorStyle.text },
                { fontFamily: fonts.bold }
            ]}>
                {phoneme}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    text: {
        fontSize: 24,
        fontWeight: '700',
    },
    correct: {
        borderColor: '#68D391',
        shadowColor: '#68D391',
        shadowOpacity: 0.4,
    },
    incorrect: {
        borderColor: '#FC8181',
        shadowColor: '#FC8181',
        shadowOpacity: 0.4,
    },
});

export default PhonemeSegment;
