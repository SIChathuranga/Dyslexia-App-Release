/**
 * ================================================================================
 * FEEDBACK CARD COMPONENT
 * ================================================================================
 * 
 * An animated feedback card that displays results to the child after checking
 * their drawing. Designed to be encouraging and non-intimidating.
 * 
 * FEATURES:
 * ---------
 * - Animated pop-in effect (spring animation)
 * - Auto-dismiss after configurable duration
 * - Fade-out animation before dismissing
 * - Random celebratory/encouraging emojis
 * - Dyslexia-friendly colors (green for success, soft red for try again)
 * - Does not block touch events (pointerEvents="none")
 * 
 * USAGE:
 * ------
 *   <FeedbackCard
 *       message="Perfect! That's A!"
 *       type="success"
 *       visible={showFeedback}
 *       onDismiss={() => setShowFeedback(false)}
 *       autoDismissMs={1500}
 *   />
 * 
 * PROPS:
 * ------
 * @prop {string} message - The feedback message to display
 * @prop {'success'|'error'|'neutral'} type - Type of feedback (determines color and emoji)
 * @prop {boolean} visible - Whether the card is visible
 * @prop {function} onDismiss - Callback when card is dismissed (optional)
 * @prop {number} autoDismissMs - Auto-dismiss duration in milliseconds (default: 1500)
 * 
 * FEEDBACK TYPES:
 * ---------------
 * - success: Green background, celebratory emojis (🎉 ⭐ 🌟)
 * - error: Soft red background, encouraging emojis (💪 🤔 📝)
 * - neutral: Blue-grey background, thinking emoji (💭)
 * 
 * ANIMATION SEQUENCE:
 * -------------------
 * 1. Card pops in with spring animation
 * 2. Waits for autoDismissMs duration
 * 3. Fades out over 300ms
 * 4. Calls onDismiss callback
 * 
 * DESIGN NOTES:
 * -------------
 * - Positioned as overlay in center of screen
 * - pointerEvents="none" allows touches to pass through
 * - Uses dyslexia-friendly soft colors (not harsh red/green)
 * - Dark grey text for readability (not pure black)
 * 
 * Author: Research Team 25-26J-333
 * ================================================================================
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from './DyslexicText';
import { colors, borderRadius, spacing, fontSizes, fontWeights, letterSpacing } from '../theme/colors';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the FeedbackCard component
 */
interface FeedbackCardProps {
    /** The feedback message to display */
    message: string;

    /** Type of feedback - determines color scheme and emoji */
    type: 'success' | 'error' | 'neutral';

    /** Whether the card is visible */
    visible: boolean;

    /** Callback when card is dismissed (optional) */
    onDismiss?: () => void;

    /** Auto-dismiss duration in milliseconds (default: 1500) */
    autoDismissMs?: number;
}

// ============================================================================
// EMOJI POOLS
// ============================================================================

/** Celebratory emojis for successful attempts */
const SUCCESS_EMOJIS = ['🎉', '⭐', '🌟', '✨', '👏', '🏆', '💫'];

/** Encouraging emojis for "try again" situations */
const ENCOURAGE_EMOJIS = ['💪', '🤔', '📝', '✨', '🎯'];

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
    message,
    type,
    visible,
    onDismiss,
    autoDismissMs = 1500,  // Default: 1.5 seconds before auto-dismiss
}) => {
    // ========================================================================
    // ANIMATION VALUES
    // ========================================================================

    // Scale animation for pop-in effect (0 = hidden, 1 = full size)
    const scaleAnim = useRef(new Animated.Value(0)).current;

    // Opacity animation for fade-out (1 = visible, 0 = transparent)
    const opacityAnim = useRef(new Animated.Value(1)).current;

    // Timer reference for auto-dismiss
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // ========================================================================
    // ANIMATION EFFECT
    // ========================================================================

    useEffect(() => {
        // Clear any existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (visible) {
            // Reset animation values
            scaleAnim.setValue(0);
            opacityAnim.setValue(1);

            // Pop-in animation (spring effect)
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,       // Lower = more bouncy
                tension: 100,      // Higher = faster
                useNativeDriver: true,
            }).start();

            // Set timer for auto-dismiss
            timerRef.current = setTimeout(() => {
                // Fade-out animation before dismissing
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 300,  // 300ms fade out
                    useNativeDriver: true,
                }).start(() => {
                    // Call onDismiss callback after fade completes
                    if (onDismiss) onDismiss();
                });
            }, autoDismissMs);
        } else {
            // Reset when hidden
            scaleAnim.setValue(0);
            opacityAnim.setValue(0);
        }

        // Cleanup timer on unmount or when dependencies change
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visible, autoDismissMs, onDismiss, opacityAnim, scaleAnim]);

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    // Don't render anything if not visible
    if (!visible) return null;

    /**
     * Get a random emoji based on feedback type
     */
    const getEmoji = () => {
        if (type === 'success') {
            // Random celebratory emoji
            return SUCCESS_EMOJIS[Math.floor(Math.random() * SUCCESS_EMOJIS.length)];
        } else if (type === 'error') {
            // Random encouraging emoji (not discouraging!)
            return ENCOURAGE_EMOJIS[Math.floor(Math.random() * ENCOURAGE_EMOJIS.length)];
        }
        // Neutral thinking emoji
        return '💭';
    };

    /**
     * Get dyslexia-friendly card colors based on feedback type
     */
    const getCardStyle = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: colors.greenLight,  // Soft green background
                    borderColor: colors.green,           // Green border
                };
            case 'error':
                return {
                    backgroundColor: colors.redLight,    // Soft red (not harsh!)
                    borderColor: colors.red,             // Soft red border
                };
            default:
                return {
                    backgroundColor: colors.blueGreyLight,  // Neutral blue-grey
                    borderColor: colors.blueGrey,
                };
        }
    };

    /**
     * Get text color - always use dark grey for readability
     */
    const getTextColor = () => {
        // Dark grey provides good contrast without being harsh
        return colors.text;
    };

    const cardStyle = getCardStyle();

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Animated.View
            style={[
                styles.container,
                cardStyle,
                {
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
            pointerEvents="none"  // Don't block touches - let them pass through to buttons
        >
            <View style={styles.content}>
                {/* Random emoji based on feedback type */}
                <Text style={styles.emoji}>{getEmoji()}</Text>

                {/* Feedback message */}
                <Text style={[styles.text, { color: getTextColor() }]} numberOfLines={2}>
                    {message}
                </Text>
            </View>
        </Animated.View>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    /**
     * Main container - positioned as overlay
     */
    container: {
        position: 'absolute',
        top: '40%',              // Centered vertically (roughly)
        left: spacing.lg,
        right: spacing.lg,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.xl,
        borderWidth: 3,          // Visible border for emphasis
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,            // Android shadow
        zIndex: 100,             // Above other content
    },

    /**
     * Content container - horizontal layout
     */
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },

    /**
     * Emoji styling
     */
    emoji: {
        fontSize: 36,
    },

    /**
     * Feedback message text
     */
    text: {
        fontSize: fontSizes.large,
        fontWeight: fontWeights.bold,
        textAlign: 'center',
        flexShrink: 1,           // Allow text to shrink if needed
        letterSpacing: letterSpacing.normal,  // Dyslexia-friendly spacing
    },
});
