/**
 * ================================================================================
 * WORD COUNT PRACTICE SCREEN
 * ================================================================================
 *
 * A learning interface for dyslexic children to practice counting letters in words.
 * Children see a random word and must write the number of letters it contains.
 *
 * FLOW:
 * -----
 * 1. Screen loads with a random word (max 6 letters)
 * 2. Text-to-speech announces "How many letters are in [WORD]?"
 * 3. Child counts the letters mentally
 * 4. Child draws the number on the canvas
 * 5. Child presses "Check" button
 * 6. Canvas is captured and sent to digit recognition model
 * 7. ML model predicts the digit
 * 8. Feedback is shown (success or try again)
 * 9. Child can press "Next" for a new word
 *
 * LEARNING OBJECTIVES:
 * --------------------
 * - Letter recognition and counting
 * - Number writing practice
 * - Visual and auditory learning combination
 * - Building phonological awareness
 *
 * FEATURES:
 * ---------
 * - Dyslexia-friendly color palette
 * - Fun cartoon mascots
 * - Speech bubble design
 * - Large word display with letter spacing
 * - Drawing canvas with guide lines
 * - Clear button inside canvas
 * - Auto-dismissing feedback
 * - Connection status indicator
 * - Audio feedback for questions and results
 *
 * DYSLEXIA-FRIENDLY ELEMENTS:
 * ---------------------------
 * - Warm peach/cream backgrounds (not white)
 * - Dark grey text (not black)
 * - Large fonts with letter spacing
 * - Soft, non-vibrating colors
 * - Encouraging feedback
 * - Lenient matching for similar digits (1/7, 6/0, etc.)
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
import { loadMathModel, predictDigitFromBase64, isDigitBackendConnected } from '../ml/mathSymbolModel';
import { SessionTracker } from '../services/SessionTracker';
import { hapticSuccess, hapticFailure } from '../services/HapticFeedback';
// ============================================================================
// CONSTANTS
// ============================================================================
/** Fun cartoon mascots that appear next to the speech bubble */
const MASCOTS = ['🐰', '🐻', '🦊', '🐨', '🐼', '🦁', '🐸', '🐵', '🦋', '🐝'];
/**
 * Word list for practice - carefully curated for dyslexic children
 * Organized by letter count (2-6 letters)
 *
 * Selection criteria:
 * - Common, familiar words children know
 * - No confusing letter patterns (like "their/there")
 * - Simple phonetic structure
 * - Varied starting letters
 */
const WORD_LISTS = {
    2: ['AT', 'GO', 'UP', 'NO', 'ME', 'WE', 'SO', 'AN', 'DO', 'IS'],
    3: ['CAT', 'DOG', 'SUN', 'BIG', 'HAT', 'RUN', 'FUN', 'RED', 'TOP', 'CUP', 'BED', 'JAM', 'HOP', 'MOM', 'DAD'],
    4: ['BALL', 'FISH', 'STAR', 'MOON', 'TREE', 'BIRD', 'CAKE', 'JUMP', 'PLAY', 'RAIN', 'BOOK', 'MILK', 'FROG', 'DUCK', 'LAMP'],
    5: ['APPLE', 'BEACH', 'CLOUD', 'DANCE', 'EARTH', 'FAIRY', 'GRAPE', 'HAPPY', 'LIGHT', 'MOUSE', 'OCEAN', 'PLANT', 'QUEEN', 'RIVER', 'SMILE'],
    6: ['BANANA', 'CASTLE', 'DRAGON', 'FLOWER', 'GARDEN', 'MONKEY', 'ORANGE', 'RABBIT', 'SUNSET', 'TURTLE', 'WINDOW', 'YELLOW', 'ZIGZAG', 'PLANET', 'BUTTON']
};
/**
 * Get all words flattened for random selection
 */
const getAllWords = () => {
    return Object.values(WORD_LISTS).flat();
};
/**
 * Visually similar digits for lenient matching
 * Used when children's handwriting causes confusion
 */
const SIMILAR_DIGITS = {
    '0': ['6', 'O'],
    '1': ['7', 'I', 'L'],
    '2': ['Z'],
    '3': ['8'],
    '4': ['9'],
    '5': ['S'],
    '6': ['0', '9'],
    '7': ['1'],
    '8': ['3', '0'],
    '9': ['4', '6']
};
// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================
/**
 * Word Count Practice Screen Component
 *
 * Main practice screen where children count letters in words and
 * write the answer, receiving ML-powered feedback.
 */
export const WordCountPracticeScreen = () => {
    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================
    /**
     * Get a random word from the word lists
     */
    const getRandomWord = () => {
        const allWords = getAllWords();
        return allWords[Math.floor(Math.random() * allWords.length)];
    };
    /**
     * Get a random cartoon mascot emoji
     */
    const getRandomMascot = () => {
        return MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
    };
    /**
     * Check if the predicted digit is acceptable for the expected answer
     * Uses lenient matching for visually similar digits
     */
    const isAcceptableAnswer = (predicted, expected) => {
        // Exact match
        if (predicted === expected)
            return true;
        // Check similar digits
        const similarToExpected = SIMILAR_DIGITS[expected] || [];
        if (similarToExpected.includes(predicted))
            return true;
        return false;
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
    const mascotSize = Math.round(44 * layoutScale);
    const bubblePadding = Math.max(8, Math.round(spacing.md * layoutScale));
    const wordPadH = Math.max(12, Math.round(spacing.lg * layoutScale));
    const wordPadV = Math.max(8, Math.round(spacing.md * layoutScale));
    const wordFontSize = Math.max(24, Math.round(fontSizes.title * layoutScale));
    const dotSize = Math.max(6, Math.round(10 * layoutScale));
    /** The current word to count letters in */
    const [currentWord, setCurrentWord] = useState(getRandomWord());
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
            await loadMathModel();
            setConnectionStatus(isDigitBackendConnected() ? 'connected' : 'disconnected');
        };
        initBackend();
        // Start tracking session
        SessionTracker.startSession();
        return () => {
            SessionTracker.endSession();
        };
    }, []);
    /**
     * Announce the word counting question when word changes
     */
    useEffect(() => {
        // Small delay to let the UI settle
        const timer = setTimeout(() => {
            speakQuestion();
        }, 500);
        SessionTracker.startChallenge(currentWord.length.toString());
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWord]);
    /**
     * Speak the question with the current word
     */
    const speakQuestion = () => {
        // Spell out the word for better understanding
        const spelledWord = currentWord.split('').join(', ');
        speak(`How many letters are in the word ${currentWord}? The word is spelled: ${spelledWord}`);
    };
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
     * Repeat the question using text-to-speech
     */
    const handleRepeatQuestion = () => {
        speakQuestion();
    };
    /**
     * Check the drawing against the expected letter count
     *
     * 1. Validates that something was drawn
     * 2. Captures canvas as base64 image
     * 3. Sends to backend for digit prediction
     * 4. Compares with expected count
     * 5. Shows success or try-again feedback
     */
    const handleCheck = async () => {
        // Check if anything was drawn
        const paths = canvasRef.current?.getPaths() || [];
        if (paths.length === 0) {
            setFeedback({ message: 'Draw a number first!', type: 'neutral' });
            speak('Draw a number first');
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
            // Send to backend for digit prediction
            const result = await predictDigitFromBase64(base64Image);
            const predictedDigit = result.digit;
            const expectedAnswer = currentWord.length.toString();
            // Log for debugging
            console.log(`Word: "${currentWord}" (${currentWord.length} letters)`);
            console.log(`Predicted: "${predictedDigit}", Expected: "${expectedAnswer}"`);
            // Check if answer is acceptable (including similar digits)
            if (isAcceptableAnswer(predictedDigit, expectedAnswer)) {
                // Success!
                hapticSuccess();
                const successMessages = [
                    `Perfect! "${currentWord}" has ${expectedAnswer} letters!`,
                    `Great job! You counted ${expectedAnswer} letters correctly!`,
                    `Wonderful! That's right - ${expectedAnswer} letters!`,
                    `You got it! ${currentWord} = ${expectedAnswer} letters!`
                ];
                const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
                setFeedback({
                    message: randomMessage,
                    type: 'success'
                });
                speak(`Perfect! ${currentWord} has ${expectedAnswer} letters!`);
                // Track successful attempt
                await SessionTracker.recordAttempt('word_count', expectedAnswer, predictedDigit, true, `Word: ${currentWord}`);
            }
            else {
                // Try again - provide helpful feedback
                hapticFailure();
                const tryAgainMessages = [
                    `I saw ${predictedDigit}, but "${currentWord}" has ${expectedAnswer} letters. Try again!`,
                    `Almost! Count the letters in "${currentWord}" carefully. It has ${expectedAnswer}!`,
                    `Let's try again! "${currentWord}" has ${expectedAnswer} letters.`
                ];
                const randomMessage = tryAgainMessages[Math.floor(Math.random() * tryAgainMessages.length)];
                setFeedback({
                    message: randomMessage,
                    type: 'error'
                });
                speak(`Let's try again! ${currentWord} has ${expectedAnswer} letters.`);
                // Track failed attempt
                await SessionTracker.recordAttempt('word_count', expectedAnswer, predictedDigit, false, `Word: ${currentWord}`);
            }
        }
        catch (error) {
            console.error('Prediction error:', error);
            setFeedback({ message: 'Connection error. Try again!', type: 'error' });
            speak('Something went wrong. Please try again.');
        }
        setIsLoading(false);
        setShowFeedback(true);
    };
    /**
     * Move to the next word
     *
     * Gets a new random word and clears the canvas
     */
    const handleNext = () => {
        let newWord = getRandomWord();
        // Make sure we get a different word
        while (newWord === currentWord && getAllWords().length > 1) {
            newWord = getRandomWord();
        }
        setCurrentWord(newWord);
        canvasRef.current?.clear();
        setCanvasKey(prev => prev + 1);
        setShowFeedback(false);
    };
    /**
     * Retry backend connection
     */
    const handleRetryConnection = async () => {
        setConnectionStatus('connecting');
        await loadMathModel();
        setConnectionStatus(isDigitBackendConnected() ? 'connected' : 'disconnected');
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
    /**
     * Format word with visual letter spacing for easier counting
     */
    const formatWordWithSpacing = (word) => {
        return word.split('').join(' ');
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
                    <Text style={[styles.mascot, { fontSize: mascotSize }]}>{mascot}</Text>

                    <View style={[styles.speechBubble, { padding: bubblePadding }]}>
                        <View style={styles.bubbleArrow}/>
                        <Text style={styles.speechText}>How many letters?</Text>

                        <View style={[styles.wordContainer, { paddingHorizontal: wordPadH, paddingVertical: wordPadV }]}>
                            <Text style={[styles.wordText, { fontSize: wordFontSize }]}>{formatWordWithSpacing(currentWord)}</Text>
                        </View>

                        <View style={styles.letterHint}>
                            {currentWord.split('').map((_, index) => (<View key={index} style={[styles.letterDot, { width: dotSize, height: dotSize, borderRadius: Math.round(dotSize / 2) }]}/>))}
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.repeatButton} onPress={handleRepeatQuestion}>
                            <Text style={styles.repeatIcon}>🔊</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statusBadge} onPress={connectionStatus === 'disconnected' ? handleRetryConnection : undefined}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]}/>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ============================================== */}
                {/* INSTRUCTION TEXT */}
                {/* ============================================== */}
                <View style={styles.instructionContainer}>
                    <Text style={styles.instructionText}>
                        Count the letters and write the number! ✏️
                    </Text>
                </View>

                {/* ============================================== */}
                {/* CANVAS SECTION - Drawing area */}
                {/* ============================================== */}
                <View style={styles.canvasSection}>
                    <View style={[styles.canvasWrapper, { width: canvasSize, height: canvasSize }]}>
                        <DrawingCanvas ref={canvasRef} key={canvasKey} canvasHeight={canvasSize} strokeWidth={18} showGuideLines={true}/>

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
            <FeedbackCard message={feedback.message} type={feedback.type} visible={showFeedback} onDismiss={handleFeedbackDismiss} autoDismissMs={2000} // 2 seconds for longer messages
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
        paddingBottom: spacing.sm,
        marginBottom: spacing.md,
    },
    /**
     * Cartoon mascot emoji
     */
    mascot: {
        fontSize: 44,
        marginRight: spacing.sm,
    },
    /**
     * Speech bubble containing the instruction
     */
    speechBubble: {
        flex: 1,
        backgroundColor: colors.turquoiseLight, // Fresh turquoise for counting theme
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        alignItems: 'center',
        position: 'relative',
        shadowColor: colors.turquoise,
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
        borderRightColor: colors.turquoiseLight,
    },
    /**
     * "How many letters?" text
     */
    speechText: {
        fontSize: fontSizes.body,
        color: colors.text,
        fontWeight: fontWeights.semiBold,
        letterSpacing: letterSpacing.normal,
        marginBottom: spacing.xs,
    },
    /**
     * Container for the word display
     */
    wordContainer: {
        backgroundColor: colors.cardBackground,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        marginVertical: spacing.xs,
        borderWidth: 2,
        borderColor: colors.turquoise,
    },
    /**
     * Large word display with letter spacing
     */
    wordText: {
        fontSize: fontSizes.title,
        fontWeight: fontWeights.extraBold,
        color: colors.primaryDark,
        letterSpacing: letterSpacing.wider + 4, // Extra spacing between letters
        textAlign: 'center',
    },
    /**
     * Letter hint container (visual dots)
     */
    letterHint: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xs,
        gap: spacing.xs,
    },
    /**
     * Individual dot representing each letter
     */
    letterDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.turquoise,
    },
    /**
     * Header actions container (repeat & status)
     */
    headerActions: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.sm,
        marginLeft: spacing.xs,
    },
    /**
     * Repeat question button
     */
    repeatButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.yellowLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.orange,
    },
    /**
     * Repeat button icon
     */
    repeatIcon: {
        fontSize: 20,
    },
    /**
     * Connection status badge
     */
    statusBadge: {
        marginTop: spacing.xs,
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
     * Instruction text container
     */
    instructionContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
        alignItems: 'center',
    },
    /**
     * Instruction text
     */
    instructionText: {
        fontSize: fontSizes.body,
        color: colors.textLight,
        fontWeight: fontWeights.semiBold,
        letterSpacing: letterSpacing.normal,
        textAlign: 'center',
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
