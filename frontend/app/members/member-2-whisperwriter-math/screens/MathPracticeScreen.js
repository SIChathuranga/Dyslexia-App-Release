/**
 * ================================================================================
 * MATH PRACTICE SCREEN
 * ================================================================================
 *
 * A learning interface where dyslexic children solve simple math problems
 * by drawing the numeric answer on the canvas.
 *
 * CONCEPT:
 * --------
 * A math equation is displayed (e.g. "3 + 4 = ?") and the child draws the
 * answer digit on the canvas. The ML model predicts the digit and checks it.
 *
 * FLOW:
 * -----
 * 1. Screen loads with a randomly generated math problem
 * 2. TTS announces "Solve: 3 plus 4"
 * 3. Child solves the problem mentally
 * 4. Child draws the digit answer on the canvas
 * 5. Child presses "Check" button
 * 6. Canvas is captured and sent to digit recognition backend
 * 7. ML model predicts the digit (0-9)
 * 8. Feedback is shown (correct answer or try again with hint)
 * 9. Child can press "Next" for a new problem
 *
 * PROBLEM TYPES:
 * --------------
 * - Addition (+): 1-5 + 0-9 = answers ≤ 9
 * - Subtraction (-): larger - smaller, answers ≥ 0
 * - Multiplication (×): limited to single-digit answers ≤ 9
 *
 * DYSLEXIA-FRIENDLY ELEMENTS:
 * ---------------------------
 * - Warm peach/cream background (not white)
 * - Dark grey text (not harsh black)
 * - Large fonts with letter spacing
 * - Encouraging feedback messages
 * - Audio support via text-to-speech
 * - Fun cartoon mascot
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import { Text } from '../components/DyslexicText';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, TouchableOpacity, ScrollView, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { FeedbackCard } from '../components/FeedbackCard';
import { colors, spacing, borderRadius, fontSizes, fontWeights, letterSpacing } from '../theme/colors';
import { isDigitBackendConnected, loadMathModel, predictDigitFromBase64 } from '../ml/mathSymbolModel';
import { speak } from '../tts/speak';
import { SessionTracker } from '../services/SessionTracker';
import { hapticSuccess, hapticFailure } from '../services/HapticFeedback';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Fun cartoon mascots shown next to the speech bubble */
const MATH_MASCOTS = ['🤖', '🦉', '🐙', '🦋', '🐢', '🦄', '🐝', '🌟'];

// ============================================================================
// HELPER: MATH PROBLEM GENERATOR
// ============================================================================

/**
 * Generate a random, age-appropriate math problem with a single-digit answer.
 *
 * Operations and ranges are restricted so:
 * - All answers fit within 0-9 (single digit for ML model)
 * - Problems are achievable for young dyslexic learners
 *
 * @returns Object with equation string, spoken version, and numeric answer
 */
const generateMathProblem = () => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer;

    if (operation === '+') {
        // Addition: ensure sum ≤ 9
        num1 = Math.floor(Math.random() * 5) + 1;
        num2 = Math.floor(Math.random() * (10 - num1));
        answer = num1 + num2;
    } else if (operation === '-') {
        // Subtraction: ensure answer ≥ 0
        num1 = Math.floor(Math.random() * 5) + 5;
        num2 = Math.floor(Math.random() * (num1 + 1));
        answer = num1 - num2;
    } else {
        // Multiplication: only safe single-digit answer pairs
        const validPairs = [
            [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9],
            [2, 1], [2, 2], [2, 3], [2, 4],
            [3, 1], [3, 2], [3, 3],
            [4, 1], [4, 2],
            [5, 1], [6, 1], [7, 1], [8, 1], [9, 1]
        ];
        const pair = validPairs[Math.floor(Math.random() * validPairs.length)];
        num1 = pair[0];
        num2 = pair[1];
        answer = num1 * num2;
    }

    // Human-friendly spoken form and display symbol
    let opWord = operation === '+' ? 'plus' : operation === '-' ? 'minus' : 'times';
    const displayOperation = operation === '*' ? '×' : operation;

    return {
        equation: `${num1} ${displayOperation} ${num2} = ?`,
        spokenEquation: `${num1} ${opWord} ${num2}`,
        answer
    };
};

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export const MathPracticeScreen = () => {
    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    /** Get a random mascot emoji */
    const getRandomMascot = () => {
        return MATH_MASCOTS[Math.floor(Math.random() * MATH_MASCOTS.length)];
    };

    // ========================================================================
    // RESPONSIVE LAYOUT CALCULATIONS
    // ========================================================================
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const baseCanvasSize = width - (spacing.xl * 2);
    const tabBarHeight = 70;
    const layoutScale = Math.min(1, height / 780);
    const canvasSize = Math.max(200, Math.floor(baseCanvasSize));
    const mascotSize = Math.round(46 * layoutScale);
    const bubblePadding = Math.max(8, Math.round(spacing.md * layoutScale));
    const eqPadH = Math.max(12, Math.round(spacing.lg * layoutScale));
    const eqPadV = Math.max(8, Math.round(spacing.sm * layoutScale));
    const equationFontSize = Math.max(28, Math.round(40 * layoutScale));

    // ========================================================================
    // STATE
    // ========================================================================

    /** The current math problem to solve */
    const [problem, setProblem] = useState(generateMathProblem());

    /** Random mascot for this session */
    const [mascot] = useState(getRandomMascot());

    /** Current feedback message and its type */
    const [feedback, setFeedback] = useState({ message: '', type: 'neutral' });

    /** Whether to show the feedback card overlay */
    const [showFeedback, setShowFeedback] = useState(false);

    /** Whether the Check button is processing */
    const [isLoading, setIsLoading] = useState(false);

    /** Whether the digit model is still initializing */
    const [isModelLoading, setIsModelLoading] = useState(true);

    /** Backend connection indicator ('connecting' | 'connected' | 'disconnected') */
    const [connectionStatus, setConnectionStatus] = useState('connecting');

    /** Key used to force canvas re-render on clear */
    const [canvasKey, setCanvasKey] = useState(0);

    // ========================================================================
    // REFS
    // ========================================================================

    /** Reference to the drawing canvas for capture and clear operations */
    const canvasRef = useRef(null);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /**
     * On mount: initialize the digit recognition backend and speak the first problem.
     * Starts a SessionTracker session for progress analytics.
     */
    useEffect(() => {
        const initModel = async () => {
            setIsModelLoading(true);
            setConnectionStatus('connecting');
            await loadMathModel();
            setIsModelLoading(false);
            setConnectionStatus(isDigitBackendConnected() ? 'connected' : 'disconnected');
            speak(`Solve: ${problem.spokenEquation}`);
            SessionTracker.startChallenge(problem.answer.toString());
        };
        initModel();

        // Start tracking session for progress analytics
        SessionTracker.startSession();
        return () => {
            SessionTracker.endSession();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Dismiss the feedback card overlay
     */
    const handleFeedbackDismiss = () => {
        setShowFeedback(false);
    };

    /**
     * Check the drawn digit against the expected answer.
     *
     * 1. Validates that the canvas is not empty
     * 2. Captures the canvas as base64
     * 3. Sends to the digit recognition backend
     * 4. Compares prediction with expected answer
     * 5. Shows success or try-again feedback
     */
    const handleCheck = async () => {
        if (!canvasRef.current) return;

        // Guard: canvas must have drawn strokes
        const paths = canvasRef.current.getPaths();
        if (paths.length === 0) {
            setFeedback({ message: 'Draw your answer!', type: 'neutral' });
            speak('Draw your answer');
            setShowFeedback(true);
            return;
        }

        setIsLoading(true);
        setShowFeedback(false);

        try {
            // Capture canvas as base64 PNG
            const base64Image = await canvasRef.current.captureAsBase64();

            // Send to backend digit model
            const prediction = await predictDigitFromBase64(base64Image);
            const expectedAnswer = problem.answer.toString();
            const isCorrect = prediction.digit === expectedAnswer;

            if (isCorrect) {
                // Correct answer
                hapticSuccess();
                setFeedback({
                    message: `Correct! ${problem.equation.replace('?', expectedAnswer)}`,
                    type: 'success'
                });
                speak('Correct!');
                await SessionTracker.recordAttempt('math_practice', expectedAnswer, prediction.digit, true, problem.equation);
            } else {
                // Wrong answer — reveal the correct one
                hapticFailure();
                setFeedback({
                    message: `Answer is ${expectedAnswer}`,
                    type: 'error'
                });
                speak(`The answer is ${expectedAnswer}`);
                await SessionTracker.recordAttempt('math_practice', expectedAnswer, prediction.digit, false, problem.equation);
            }
        } catch {
            setFeedback({ message: 'Connection error', type: 'error' });
        }

        setIsLoading(false);
        setShowFeedback(true);
    };

    /**
     * Clear the canvas and hide feedback
     */
    const handleClear = () => {
        canvasRef.current?.clear();
        setCanvasKey(prev => prev + 1); // Force canvas re-render
        setShowFeedback(false);
    };

    /**
     * Move to the next math problem.
     * Clears the canvas and speaks the new problem via TTS.
     */
    const handleNext = () => {
        const newProblem = generateMathProblem();
        setProblem(newProblem);
        setShowFeedback(false);
        canvasRef.current?.clear();
        setCanvasKey(prev => prev + 1);
        speak(`Solve: ${newProblem.spokenEquation}`);
        SessionTracker.startChallenge(newProblem.answer.toString());
    };

    /**
     * Retry backend connection when status dot is tapped
     */
    const handleRetryConnection = async () => {
        setConnectionStatus('connecting');
        setIsModelLoading(true);
        await loadMathModel();
        setIsModelLoading(false);
        setConnectionStatus(isDigitBackendConnected() ? 'connected' : 'disconnected');
    };

    /**
     * Get the color for the connection status dot
     */
    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return colors.statusConnected;    // Green
            case 'connecting': return colors.statusConnecting;  // Yellow
            case 'disconnected': return colors.statusDisconnected; // Red
        }
    };

    // ========================================================================
    // LOADING STATE
    // ========================================================================

    if (isModelLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingEmoji}>🔢</Text>
                    <ActivityIndicator size="large" color={colors.purple} />
                    <Text style={styles.loadingText}>Getting ready...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: spacing.lg + insets.bottom + tabBarHeight + 16 }
                ]}
            >
                {/* ============================================== */}
                {/* HEADER - Mascot with speech bubble & equation  */}
                {/* ============================================== */}
                <View style={styles.header}>
                    {/* Cartoon mascot */}
                    <Text style={[styles.mascot, { fontSize: mascotSize }]}>{mascot}</Text>

                    {/* Speech bubble with equation */}
                    <View style={[styles.speechBubble, { padding: bubblePadding }]}>
                        <View style={styles.bubbleArrow} />
                        <Text style={styles.speechText}>Solve this!</Text>

                        {/* Large equation display */}
                        <View style={[styles.equationContainer, { paddingHorizontal: eqPadH, paddingVertical: eqPadV }]}>
                            <Text style={[styles.equationText, { fontSize: equationFontSize }]}>
                                {problem.equation}
                            </Text>
                        </View>
                    </View>

                    {/* Connection status dot — tap to retry when disconnected */}
                    <TouchableOpacity
                        style={styles.statusBadge}
                        onPress={connectionStatus === 'disconnected' ? handleRetryConnection : undefined}
                    >
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                    </TouchableOpacity>
                </View>

                {/* ============================================== */}
                {/* CANVAS SECTION - Drawing area for the answer  */}
                {/* ============================================== */}
                <View style={styles.canvasSection}>
                    <View style={[styles.canvasWrapper, { width: canvasSize, height: canvasSize }]}>
                        <DrawingCanvas
                            ref={canvasRef}
                            key={canvasKey}
                            canvasHeight={canvasSize}
                            strokeWidth={14}
                            showGuideLines={false} // No guide lines for digits
                        />

                        {/* Clear button — top-right inside canvas */}
                        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                            <Text style={styles.clearIcon}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ============================================== */}
                {/* BOTTOM BUTTONS - Check and Next               */}
                {/* ============================================== */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.checkButton, isLoading && styles.buttonDisabled]}
                        onPress={handleCheck}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? <ActivityIndicator size="small" color={colors.text} />
                            : (
                                <>
                                    <Text style={styles.buttonIcon}>✓</Text>
                                    <Text style={styles.buttonText}>Check</Text>
                                </>
                            )
                        }
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext}>
                        <Text style={styles.buttonText}>Next</Text>
                        <Text style={styles.buttonIcon}>→</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ============================================== */}
            {/* FEEDBACK OVERLAY                              */}
            {/* ============================================== */}
            <FeedbackCard
                message={feedback.message}
                type={feedback.type}
                visible={showFeedback}
                onDismiss={handleFeedbackDismiss}
                autoDismissMs={1200}
            />
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    /** Main container with dyslexia-friendly warm background */
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: spacing.lg,
    },

    // === LOADING STATE ===
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingEmoji: {
        fontSize: 56,
        marginBottom: spacing.md,
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: fontSizes.large,
        color: colors.purple,
        fontWeight: fontWeights.semiBold,
        letterSpacing: letterSpacing.normal,
    },

    // === HEADER ===
    /** Header row: mascot + speech bubble + status dot */
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        marginBottom: spacing.xs,
    },
    /** Cartoon mascot emoji */
    mascot: {
        fontSize: 48,
        marginRight: spacing.sm,
    },
    /** Purple speech bubble — math theme */
    speechBubble: {
        flex: 1,
        backgroundColor: colors.purpleLight,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        alignItems: 'center',
        position: 'relative',
        shadowColor: colors.purple,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    /** CSS triangle pointing left toward the mascot */
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
        borderRightColor: colors.purpleLight,
    },
    /** "Solve this!" instruction text */
    speechText: {
        fontSize: fontSizes.body,
        color: colors.text,
        fontWeight: fontWeights.semiBold,
        letterSpacing: letterSpacing.normal,
        marginBottom: spacing.xs,
    },
    /** Yellow highlighted equation box — good contrast for dyslexia */
    equationContainer: {
        backgroundColor: colors.yellowLight,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 3,
        borderColor: colors.orange,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    /** Large bold equation text */
    equationText: {
        fontSize: 40,
        fontWeight: fontWeights.extraBold,
        color: colors.text,
        letterSpacing: letterSpacing.wide,
    },
    /** Connection status badge (tap to retry) */
    statusBadge: {
        marginLeft: spacing.sm,
        marginTop: spacing.sm,
    },
    /** Colored dot indicating connection state */
    statusDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: colors.cardBackground,
    },

    // === CANVAS ===
    /** Centered canvas section */
    canvasSection: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
    },
    /** Relative container so clear button can be positioned absolutely */
    canvasWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    /** Trash button overlaid inside the canvas */
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
    /** Trash icon emoji */
    clearIcon: {
        fontSize: 20,
    },

    // === BOTTOM BUTTONS ===
    /** Row container for Check and Next buttons */
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.md,
        backgroundColor: colors.background,
    },
    /** Base style shared by all action buttons */
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
    /** Green Check button — dyslexia green */
    checkButton: {
        backgroundColor: colors.green,
    },
    /** Blue Next button — dyslexia blue */
    nextButton: {
        backgroundColor: colors.blue,
    },
    /** Disabled state when processing */
    buttonDisabled: {
        opacity: 0.6,
    },
    /** Button icon (✓ or →) */
    buttonIcon: {
        fontSize: 24,
        color: colors.text,
        fontWeight: fontWeights.bold,
    },
    /** Button label text */
    buttonText: {
        fontSize: fontSizes.large,
        fontWeight: fontWeights.bold,
        color: colors.text,
        letterSpacing: letterSpacing.normal,
    },
});
