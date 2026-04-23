import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { Text } from './DyslexicText';
import { colors, borderRadius, spacing, fontSizes, fontWeights, letterSpacing } from '../theme/colors';
export const PrimaryButton = ({ title, onPress, style, textStyle, color = colors.blue, // Dyslexia blue as default
disabled = false, icon, size = 'medium', }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };
    const getSizeStyle = () => {
        switch (size) {
            case 'small':
                return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
            case 'large':
                return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl };
            default:
                return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
        }
    };
    const getFontSize = () => {
        switch (size) {
            case 'small': return fontSizes.body;
            case 'large': return fontSizes.xlarge;
            default: return fontSizes.large;
        }
    };
    return (<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity style={[
            styles.button,
            getSizeStyle(),
            {
                backgroundColor: disabled ? colors.grey : color,
                opacity: disabled ? 0.7 : 1,
            },
            style,
        ]} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={0.9} disabled={disabled}>
                <View style={styles.contentRow}>
                    {icon && <Text style={styles.icon}>{icon}</Text>}
                    <Text style={[
            styles.text,
            { fontSize: getFontSize() },
            textStyle
        ]}>
                        {title}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>);
};
const styles = StyleSheet.create({
    button: {
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    icon: {
        fontSize: 24,
    },
    text: {
        color: colors.text, // Dark grey text for better readability
        fontWeight: fontWeights.bold,
        letterSpacing: letterSpacing.normal,
    },
});
