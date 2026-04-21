import React from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, Circle, Path } from 'react-native-svg';

const Mascot = ({ mood = 'happy', size = 'medium' }) => {
    const sizes = {
        small: 64,
        medium: 96,
        large: 128,
    };

    const dimension = sizes[size] || sizes.medium;

    const getPupilY = () => {
        switch (mood) {
            case 'excited': return 30;
            case 'encouraging': return 33;
            case 'thinking': return 32;
            default: return 32;
        }
    };

    return (
        <View style={{ width: dimension, height: dimension }}>
            <Svg viewBox="0 0 100 100" width={dimension} height={dimension}>
                {/* Body */}
                <Ellipse cx="50" cy="60" rx="35" ry="40" fill="#A8D5E2" />

                {/* Wings */}
                <Ellipse cx="20" cy="60" rx="15" ry="25" fill="#7FB3D5" />
                <Ellipse cx="80" cy="60" rx="15" ry="25" fill="#7FB3D5" />

                {/* Head */}
                <Circle cx="50" cy="35" r="28" fill="#A8D5E2" />

                {/* Eyes background */}
                <Circle cx="40" cy="32" r="12" fill="white" />
                <Circle cx="60" cy="32" r="12" fill="white" />

                {/* Pupils */}
                {mood === 'thinking' ? (
                    <>
                        <Ellipse cx="40" cy="32" rx="6" ry="4" fill="#2C3E50" />
                        <Ellipse cx="60" cy="32" rx="6" ry="4" fill="#2C3E50" />
                    </>
                ) : (
                    <>
                        <Circle cx="40" cy={getPupilY()} r="6" fill="#2C3E50" />
                        <Circle cx="60" cy={getPupilY()} r="6" fill="#2C3E50" />
                        <Circle cx="38" cy={getPupilY() - 2} r="2" fill="white" />
                        <Circle cx="58" cy={getPupilY() - 2} r="2" fill="white" />
                    </>
                )}

                {/* Beak */}
                <Path d="M 50 38 L 45 45 L 55 45 Z" fill="#F4A460" />

                {/* Belly spot */}
                <Ellipse cx="50" cy="70" rx="18" ry="22" fill="#E8F4F8" opacity="0.6" />
            </Svg>
        </View>
    );
};

export default Mascot;
