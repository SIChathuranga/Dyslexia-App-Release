/**
 * ================================================================================
 * LETTER PRACTICE SCREEN
 * ================================================================================
 *
 * The main letter writing practice screen for dyslexic children.
 * Children are shown a target letter and draw it on the canvas.
 * The ML model predicts their drawing and provides feedback.
 *
 * FLOW:
 * -----
 * 1. Screen loads with a random letter (A-Z)
 * 2. Text-to-speech announces "Draw the letter X"
 * 3. Child draws on the canvas
 * 4. Child presses "Check" button
 * 5. Canvas is captured as image and sent to backend
 * 6. ML model predicts the letter
 * 7. Dyslexia-friendly matching determines if correct
 * 8. Feedback is shown (success or try again)
 * 9. Child can press "Next" for a new letter
 *
 * FEATURES:
 * ---------
 * - Dyslexia-friendly color palette
 * - Fun cartoon mascots
 * - Speech bubble design
 * - Large target letter display
 * - Drawing canvas with guide lines
 * - Clear button inside canvas
 * - Auto-dismissing feedback
 * - Connection status indicator
 *
 * DYSLEXIA-FRIENDLY ELEMENTS:
 * ---------------------------
 * - Warm peach/cream backgrounds (not white)
 * - Dark grey text (not black)
 * - Large fonts with letter spacing
 * - Soft, non-vibrating colors
 * - Encouraging feedback
 * - Similar letters accepted (W/V, F/E, etc.)
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import { Text } from '../components/DyslexicText';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { FeedbackCard } from '../components/FeedbackCard';
import { colors, spacing, borderRadius, fontSizes, fontWeights, letterSpacing } from '../theme/colors';
import { speak } from '../tts/speak';
import { loadLetterModel, predictLetterDyslexiaFriendlyFromBase64, isBackendConnected, isInferenceReady } from '../ml/letterModel';
import { SessionTracker } from '../services/SessionTracker';
import { hapticSuccess, hapticFailure } from '../services/HapticFeedback';
// ============================================================================
// CONSTANTS
// ============================================================================
/** Fun cartoon mascots that appear next to the speech bubble */
const MASCOTS = ['🐰', '🐻', '🦊', '🐨', '🐼', '🦁', '🐸', '🐵'];
// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================
/**
 * Letter Practice Screen Component
 *
 * Main practice screen where children draw letters and receive
 * ML-powered feedback with dyslexia-friendly matching.
 */
export const LetterPracticeScreen = () => {
    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================
    /**
     * Get a random uppercase letter (A-Z)
     */
    const getRandomChar = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return chars[Math.floor(Math.random() * chars.length)];
    };
    /**
     * Get a random cartoon mascot emoji
     */
    const getRandomMascot = () => {
        return MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
    };
    // ========================================================================
    // REFS
    // ========================================================================
    /** Reference to the drawing canvas for capturing and clearing */
    const canvasRef = useRef(null);
    // ========================================================================
    // STATE
    // ========================================================================
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const baseCanvasSize = width - (spacing.xl * 2);
    const tabBarHeight = 70;
    const layoutScale = Math.min(1, height / 780);
    const canvasSize = Math.max(200, Math.floor(baseCanvasSize));
    const mascotSize = Math.round(48 * layoutScale);
    const bubblePadding = Math.max(8, Math.round(spacing.md * layoutScale));
    const letterCircle = Math.max(64, Math.round(88 * layoutScale));
    const letterFontSize = Math.max(36, Math.round(fontSizes.huge * layoutScale));
    /** The current target letter to draw */
    const [targetLetter, setTargetLetter] = useState(getRandomChar());
    /** Random mascot that appears for this session */
    const [mascot] = useState(getRandomMascot());
    /** Current feedback message and type */
    const [feedback, setFeedback] = useState({
        message: '',
        type: 'neutral',
    });
    /** Whether to show the feedback card */
    const [showFeedback, setShowFeedback] = useState(false);
    /** Whether a prediction is in progress */
    const [isLoading, setIsLoading] = useState(false);
    /** Backend connection status */
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    /** Key for forcing canvas re-render on clear */
    const [canvasKey, setCanvasKey] = useState(0);
    // ========================================================================
    // EFFECTS
    // ========================================================================
    /**
     * Initialize backend connection on mount
     */
    useEffect(() => {
        const initBackend = async () => {
            setConnectionStatus('connecting');
            await loadLetterModel();
            setConnectionStatus(isBackendConnected() ? 'connected' : 'disconnected');
        };
        initBackend();
        // Start tracking session for progress analytics
        SessionTracker.startSession();
        return () => {
            SessionTracker.endSession();
        };
    }, []);
    /**
     * Announce target letter when it changes
     */
    useEffect(() => {
        speak(`Draw the letter ${targetLetter}`);
        SessionTracker.startChallenge(targetLetter);
    }, [targetLetter]);
    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================
    /**
     * Clear the canvas and hide feedback
     */
    const handleClear = () => {
        canvasRef.current?.clear();
        setCanvasKey(prev => prev + 1); // Force re-render
        setShowFeedback(false);
    };
    /**
     * Handle feedback card dismissal
     */
    const handleFeedbackDismiss = () => {
        setShowFeedback(false);
    };
    /**
     * Check the drawing against the target letter
     *
     * 1. Validates that something was drawn
     * 2. Captures canvas as base64 image
     * 3. Sends to backend for prediction
     * 4. Shows success or try-again feedback
     */
    const handleCheck = async () => {
        // Check if anything was drawn
        const paths = canvasRef.current?.getPaths() || [];
        if (paths.length === 0) {
            setFeedback({ message: 'Draw something first!', type: 'neutral' });
            speak('Draw something first');
            setShowFeedback(true);
            return;
        }
        if (!isBackendConnected()) {
            setFeedback({ message: 'Backend server is not reachable. Tap the status dot to reconnect.', type: 'error' });
            setShowFeedback(true);
            return;
        }
        if (!isInferenceReady()) {
            setFeedback({
                message: 'Backend connected, but model is in MOCK mode. Start backend with Python 3.11/3.12 for real recognition.',
                type: 'error'
            });
            setShowFeedback(true);
            return;
        }
        setIsLoading(true);
        setShowFeedback(false);
        try {
            // Capture canvas as base64 image
            const base64Image = await canvasRef.current?.captureAsBase64();
            if (!base64Image)
                throw new Error('Failed to capture canvas');
            // Send to backend for dyslexia-friendly prediction
            const result = await predictLetterDyslexiaFriendlyFromBase64(base64Image, targetLetter);
            // Show feedback based on result
            if (result.shouldAccept) {
                // Success! Exact match
                hapticSuccess();
                setFeedback({
                    message: result.feedbackMessage,
                    type: 'success'
                });
                speak('Perfect!');
                // Track successful attempt
                await SessionTracker.recordAttempt('letter_practice', targetLetter, result.letter || targetLetter, true, `Letter: ${targetLetter}`);
            }
            else {
                // Try again - show specific feedback from backend
                hapticFailure();
                setFeedback({
                    message: result.feedbackMessage,
                    type: 'error'
                });
                speak(`Try ${targetLetter} again`);
                // Track failed attempt
                await SessionTracker.recordAttempt('letter_practice', targetLetter, result.letter || '?', false, `Letter: ${targetLetter}`);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Connection error';
            setFeedback({ message, type: 'error' });
        }
        setIsLoading(false);
        setShowFeedback(true);
    };
    /**
     * Move to the next letter
     *
     * Gets a new random letter and clears the canvas
     */
    const handleNext = () => {
        setTargetLetter(getRandomChar());
        canvasRef.current?.clear();
        setCanvasKey(prev => prev + 1);
        setShowFeedback(false);
    };
    /**
     * Retry backend connection
     */
    const handleRetryConnection = async () => {
        setConnectionStatus('connecting');
        await loadLetterModel();
        setConnectionStatus(isBackendConnected() ? 'connected' : 'disconnected');
    };
    /**
     * Get status indicator color
     */
    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return colors.statusConnected; // Green
            case 'connecting': return colors.statusConnecting; // Yellow
            case 'disconnected': return colors.statusDisconnected; // Red
        }
    };
    // ========================================================================
    // RENDER
    // ========================================================================
    return (<SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background}/>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: spacing.lg + insets.bottom + tabBarHeight + 16 }
        ]}>
                {/* ============================================== */}
                {/* HEADER - Mascot with speech bubble */}
                {/* ============================================== */}
                <View style={styles.header}>
                    {/* Cartoon mascot */}
                    <Text style={[styles.mascot, { fontSize: mascotSize }]}>{mascot}</Text>

                    {/* Speech bubble with instruction and letter */}
                    <View style={[styles.speechBubble, { padding: bubblePadding }]}>
                        <View style={styles.bubbleArrow}/>
                        <Text style={styles.speechText}>Draw this letter!</Text>

                        {/* Large circular letter display */}
                        <View style={[
            styles.letterContainer,
            { width: letterCircle, height: letterCircle, borderRadius: Math.round(letterCircle / 2) }
        ]}>
                            <Text style={[styles.targetLetter, { fontSize: letterFontSize }]}>{targetLetter}</Text>
                        </View>
                    </View>

                    {/* Connection status indicator */}
                    <TouchableOpacity style={styles.statusBadge} onPress={connectionStatus === 'disconnected' ? handleRetryConnection : undefined}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]}/>
                    </TouchableOpacity>
                </View>

                {/* ============================================== */}
                {/* CANVAS SECTION - Drawing area */}
                {/* ============================================== */}
                <View style={styles.canvasSection}>
                    <View style={[styles.canvasWrapper, { width: canvasSize, height: canvasSize }]}>
                        <DrawingCanvas ref={canvasRef} key={canvasKey} canvasHeight={canvasSize} strokeWidth={18} showGuideLines={true}/>

                        {/* Clear button positioned inside canvas */}
                        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                            <Text style={styles.clearIcon}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ============================================== */}
                {/* BOTTOM BUTTONS - Check and Next */}
                {/* ============================================== */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.checkButton, isLoading && styles.buttonDisabled]} onPress={handleCheck} disabled={isLoading}>
                        {isLoading ? (<ActivityIndicator size="small" color={colors.text}/>) : (<>
                                <Text style={styles.buttonIcon}>✓</Text>
                                <Text style={styles.buttonText}>Check</Text>
                            </>)}
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext}>
                        <Text style={styles.buttonText}>Next</Text>
                        <Text style={styles.buttonIcon}>→</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ============================================== */}
            {/* FEEDBACK OVERLAY */}
            {/* ============================================== */}
            <FeedbackCard message={feedback.message} type={feedback.type} visible={showFeedback} onDismiss={handleFeedbackDismiss} autoDismissMs={1200} // 1.2 seconds
    />
        </SafeAreaView>);
};
// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    /**
     * Main container with dyslexia-friendly warm background
     */
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: spacing.lg,
    },
    /**
     * Header section with mascot and speech bubble
     */
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        marginBottom: spacing.md,
    },
    /**
     * Cartoon mascot emoji
     */
    mascot: {
        fontSize: 48,
        marginRight: spacing.sm,
    },
    /**
     * Speech bubble containing the instruction
     */
    speechBubble: {
        flex: 1,
        backgroundColor: colors.blueGrey, // Dyslexia-friendly blue-grey
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        alignItems: 'center',
        position: 'relative',
        shadowColor: colors.blue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    /**
     * Triangle pointing to mascot
     */
    bubbleArrow: {
        position: 'absolute',
        left: -10,
        top: 20,
        width: 0,
        height: 0,
        borderTopWidth: 10,
        borderTopColor: 'transparent',
        borderBottomWidth: 10,
        borderBottomColor: 'transparent',
        borderRightWidth: 12,
        borderRightColor: colors.blueGrey,
    },
    /**
     * "Draw this letter!" text
     */
    speechText: {
        fontSize: fontSizes.body,
        color: colors.text,
        fontWeight: fontWeights.semiBold,
        letterSpacing: letterSpacing.normal,
        marginBottom: spacing.xs,
    },
    /**
     * Circular container for the target letter
     */
    letterContainer: {
        backgroundColor: colors.peachLight, // Warm peach - easy on dyslexic eyes
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.blue,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    /**
     * Large target letter display
     */
    targetLetter: {
        fontSize: fontSizes.huge,
        fontWeight: fontWeights.extraBold,
        color: colors.primaryDark,
        letterSpacing: letterSpacing.wide,
    },
    /**
     * Connection status badge
     */
    statusBadge: {
        marginLeft: spacing.sm,
        marginTop: spacing.sm,
    },
    /**
     * Status indicator dot
     */
    statusDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: colors.cardBackground,
    },
    /**
     * Canvas section wrapper
     */
    canvasSection: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    /**
     * Canvas wrapper for positioning clear button
     */
    canvasWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    /**
     * Clear button positioned inside canvas top-right
     */
    clearButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: colors.peachLight,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.peach,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    /**
     * Trash icon in clear button
     */
    clearIcon: {
        fontSize: 20,
    },
    /**
     * Bottom button container
     */
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        gap: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
    },
    /**
     * Base button style
     */
    button: {
        flex: 1,
        height: 60,
        borderRadius: borderRadius.xl,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    /**
     * Check button - dyslexia green
     */
    checkButton: {
        backgroundColor: colors.green,
    },
    /**
     * Next button - dyslexia turquoise
     */
    nextButton: {
        backgroundColor: colors.turquoise,
    },
    /**
     * Disabled button state
     */
    buttonDisabled: {
        opacity: 0.6,
    },
    /**
     * Button icon (checkmark, arrow)
     */
    buttonIcon: {
        fontSize: 24,
        color: colors.text,
        fontWeight: fontWeights.bold,
    },
    /**
     * Button text
     */
    buttonText: {
        fontSize: fontSizes.large,
        fontWeight: fontWeights.bold,
        color: colors.text,
        letterSpacing: letterSpacing.normal,
    },
});
