import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { fonts } from '../../theme';

const ProgressRing = ({
    progress,
    size = 120,
    strokeWidth = 12,
    color = '#A78BFA',
    label
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <View style={styles.container}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                {/* Background circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </Svg>
            <View style={[styles.labelContainer, { width: size, height: size }]}>
                <Text style={[styles.percentage, { fontFamily: fonts.bold }]}>
                    {Math.round(progress)}%
                </Text>
                {label && (
                    <Text style={[styles.label, { fontFamily: fonts.regular }]}>
                        {label}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    labelContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentage: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
    },
    label: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
});

export default ProgressRing;
