/**
 * ================================================================================
 * PRIMARY BUTTON COMPONENT
 * ================================================================================
 *
 * A reusable, accessible button component with a satisfying spring press animation.
 * Used throughout the Writing & Math module for consistent button styling.
 *
 * FEATURES:
 * ---------
 * - Spring scale animation on press (press-in shrinks, release bounces back)
 * - Dyslexia-friendly large touch target
 * - Configurable color, size, and optional icon
 * - Disabled state with reduced opacity and touch blocked
 * - OpenDyslexic font via DyslexicText
 *
 * USAGE:
 * ------
 *   <PrimaryButton
 *       title="Check"
 *       onPress={handleCheck}
 *       color={colors.green}
 *       size="large"
 *       icon="✓"
 *       disabled={isLoading}
 *   />
 *
 * PROPS:
 * ------
 * @prop {string}   title    - Button label text
 * @prop {function} onPress  - Press handler callback
 * @prop {object}   style    - Additional container style overrides
 * @prop {object}   textStyle - Additional text style overrides
 * @prop {string}   color    - Background color (default: dyslexia blue)
 * @prop {boolean}  disabled - Disables button and reduces opacity
 * @prop {string}   icon     - Optional emoji/icon shown before label
 * @prop {'small'|'medium'|'large'} size - Button size variant (default: 'medium')
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { Text } from './DyslexicText';
import { colors, borderRadius, spacing, fontSizes, fontWeights, letterSpacing } from '../theme/colors';

export const PrimaryButton = ({
    title,
    onPress,
    style,
    textStyle,
    color = colors.blue, // Dyslexia blue as default
    disabled = false,
    icon,
    size = 'medium',
}) => {
    // Animated value drives the scale spring animation
    const scaleAnim = useRef(new Animated.Value(1)).current;

    /**
     * Shrink the button slightly when pressed (tactile feedback)
     */
    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    /**
     * Bounce back to full size on release
     */
    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    /**
     * Return padding values for the selected size variant
     */
    const getSizeStyle = () => {
        switch (size) {
            case 'small':
                return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
            case 'large':
                return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl };
            default: // 'medium'
                return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
        }
    };

    /**
     * Return font size for the selected size variant
     */
    const getFontSize = () => {
        switch (size) {
            case 'small': return fontSizes.body;
            case 'large': return fontSizes.xlarge;
            default: return fontSizes.large;
        }
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                style={[
                    styles.button,
                    getSizeStyle(),
                    {
                        backgroundColor: disabled ? colors.grey : color,
                        opacity: disabled ? 0.7 : 1,
                    },
                    style,
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                disabled={disabled}
            >
                <View style={styles.contentRow}>
                    {/* Optional emoji/icon before the label */}
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
        </Animated.View>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    /** Main button container */
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
        borderColor: 'rgba(255, 255, 255, 0.3)', // Subtle white border for depth
    },
    /** Horizontal row for icon + label */
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    /** Optional icon */
    icon: {
        fontSize: 24,
    },
    /** Button label — dark grey for good readability */
    text: {
        color: colors.text,
        fontWeight: fontWeights.bold,
        letterSpacing: letterSpacing.normal,
    },
});
