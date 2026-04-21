/**
 * ================================================================================
 * LETTER IN WORD PRACTICE SCREEN
 * ================================================================================
 * 
 * A learning activity for dyslexic children to improve letter recognition
 * by identifying specific letters within number words.
 * 
 * CONCEPT:
 * --------
 * Children see a question like:
 *   "What is the SECOND letter in 3 - THREE?"
 * And must draw the correct letter (H) on the canvas.
 * 
 * The position (first, second, third...) and the number word
 * (ONE, TWO, THREE...) change randomly each round.
 * 
 * LEARNING OBJECTIVES:
 * --------------------
 * - Letter position awareness (ordinal understanding)
 * - Word decomposition skills
 * - Letter recognition and writing practice
 * - Number-word association reinforcement
 * - Building phonological awareness for dyslexic learners
 * 
 * FLOW:
 * -----
 * 1. Screen loads with a random number word and position
 * 2. TTS announces "What is the [position] letter in [number] [word]?"
 * 3. Word is displayed with each letter in a separate box
 * 4. The target position is highlighted with a question mark
 * 5. Child draws the letter on the canvas
 * 6. Child presses "Check" button
 * 7. Canvas is sent to letter recognition ML model
 * 8. Feedback is shown (success with confetti or try again with hint)
 * 9. Child can press "Next" for a new challenge
 * 
 * DYSLEXIA-FRIENDLY ELEMENTS:
 * ---------------------------
 * - Warm peach/cream backgrounds (reduces visual stress)
 * - Dark grey text (not harsh black)
 * - Large fonts with letter spacing
 * - Individual letter boxes for clear decomposition
 * - Highlighted target position with visual cue
 * - Encouraging, non-punitive feedback
 * - Audio support via text-to-speech
 * - Fun mascot and emoji throughout
 * 
 * Author: Research Team 25-26J-333
 * ================================================================================
 */

import { Text } from '../components/DyslexicText';
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawingCanvas, DrawingCanvasRef } from '../components/DrawingCanvas';
import { FeedbackCard } from '../components/FeedbackCard';
import {
    colors,
    spacing,
    borderRadius,
    fontSizes,
    fontWeights,
    letterSpacing
} from '../theme/colors';
import { speak } from '../tts/speak';
import {
    loadLetterModel,
    predictLetterDyslexiaFriendlyFromBase64,
    isBackendConnected,
    isInferenceReady
} from '../ml/letterModel';
import { SessionTracker } from '../services/SessionTracker';
import { hapticSuccess, hapticFailure } from '../services/HapticFeedback';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Fun cartoon mascots that appear next to the speech bubble */
const MASCOTS = ['🦉', '🐰', '🦊', '🐻', '🐨', '🦁', '🐸', '🐵', '🦋', '🐝'];

// ============================================================================
// NUMBER WORD DATA
// ============================================================================

/**
 * Number words mapped by their digit value.
 * Carefully selected for dyslexic-friendly practice:
 * - Variety of word lengths (3-6 letters)
 * - Different starting letters
 * - Common everyday words children know
 */
const NUMBER_WORDS: { digit: number; word: string }[] = [
    { digit: 1, word: 'ONE' },
    { digit: 2, word: 'TWO' },
    { digit: 3, word: 'THREE' },
    { digit: 4, word: 'FOUR' },
    { digit: 5, word: 'FIVE' },
    { digit: 6, word: 'SIX' },
    { digit: 7, word: 'SEVEN' },
    { digit: 8, word: 'EIGHT' },
    { digit: 9, word: 'NINE' },
    { digit: 10, word: 'TEN' },
];

/**
 * Ordinal position words for child-friendly display
 * These are used to describe which letter position to find
 */
const ORDINAL_WORDS: string[] = [
    'FIRST',      // 1st
    'SECOND',     // 2nd
    'THIRD',      // 3rd
    'FOURTH',     // 4th
    'FIFTH',      // 5th
];

/**
 * Ordinal emoji numbers for visual reinforcement
 */
const ORDINAL_EMOJIS: string[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

/**
 * Color palette for individual letter boxes
 * Uses soft, dyslexia-friendly pastels
 */
const LETTER_BOX_COLORS: string[] = [
    colors.blueLight,
    colors.greenLight,
    colors.peachLight,
    colors.purpleLight,
    colors.turquoiseLight,
    colors.yellowLight,
];



// ============================================================================
// HELPER TYPES
// ============================================================================

interface Challenge {
    /** The number entry (digit + word) */
    numberEntry: { digit: number; word: string };
    /** The 1-based position to find (e.g., 2 = "second") */
    position: number;
    /** The correct letter at that position */
    correctLetter: string;
    /** The ordinal word (e.g., "SECOND") */
    ordinalWord: string;
    /** The ordinal emoji (e.g., "2️⃣") */
    ordinalEmoji: string;
}

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

/**
 * Letter In Word Practice Screen Component
 * 
 * Children identify specific letters within number words,
 * combining letter position awareness with writing practice.
 */
export const LetterInWordScreen: React.FC = () => {
    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    /**
     * Generate a new random challenge
     * Picks a random number word and a valid position within it
     */
    const generateChallenge = (): Challenge => {
        // Pick a random number word
        const numberEntry = NUMBER_WORDS[Math.floor(Math.random() * NUMBER_WORDS.length)];

        // Pick a valid position (1-based, limited to word length and max 5)
        const maxPosition = Math.min(numberEntry.word.length, ORDINAL_WORDS.length);
        const position = Math.floor(Math.random() * maxPosition) + 1;

        // Get the correct letter at that position
        const correctLetter = numberEntry.word[position - 1];

        return {
            numberEntry,
            position,
            correctLetter,
            ordinalWord: ORDINAL_WORDS[position - 1],
            ordinalEmoji: ORDINAL_EMOJIS[position - 1],
        };
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
    const canvasRef = useRef<DrawingCanvasRef>(null);

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
    const questionPad = Math.max(6, Math.round(spacing.sm * layoutScale));
    const letterBoxSize = Math.max(38, Math.round(44 * layoutScale));
    const letterFontSize = Math.max(20, Math.round(fontSizes.xlarge * layoutScale));
    const positionFontSize = Math.max(10, Math.round(fontSizes.small * layoutScale));

    /** The current challenge */
    const [challenge, setChallenge] = useState<Challenge>(generateChallenge());

    /** Random mascot that appears for this session */
    const [mascot] = useState(getRandomMascot());

    /** Current feedback message and type */
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'neutral' }>({
        message: '',
        type: 'neutral',
    });

    /** Whether to show the feedback card */
    const [showFeedback, setShowFeedback] = useState(false);

    /** Whether a prediction is in progress */
    const [isLoading, setIsLoading] = useState(false);

    /** Backend connection status */
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

    /** Key for forcing canvas re-render on clear */
    const [canvasKey, setCanvasKey] = useState(0);



    /** Whether to show the answer hint after a wrong attempt */
    const [showHint, setShowHint] = useState(false);

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

        // Start tracking session
        SessionTracker.startSession();
        return () => {
            SessionTracker.endSession();
        };
    }, []);

    /**
     * Announce the challenge when it changes
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            speakChallenge();
        }, 500);
        SessionTracker.startChallenge(challenge.correctLetter);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [challenge]);

    /**
     * Speak the current challenge question
     */
    const speakChallenge = () => {
        const { ordinalWord, numberEntry } = challenge;
        // Spell out the word for clarity
        const spelledWord = numberEntry.word.split('').join(', ');
        speak(
            `What is the ${ordinalWord} letter in ${numberEntry.word}? ` +
            `Spelled: ${spelledWord}`
        );
    };

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Clear the canvas and hide feedback
     */
    const handleClear = () => {
        canvasRef.current?.clear();
        setCanvasKey(prev => prev + 1);
        setShowFeedback(false);
        setShowHint(false);
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
        speakChallenge();
    };

    /**
     * Check the drawing against the expected letter
     */
    const handleCheck = async () => {
        // Check if anything was drawn
        const paths = canvasRef.current?.getPaths() || [];

        if (paths.length === 0) {
            setFeedback({ message: 'Draw the letter first! ✏️', type: 'neutral' });
            speak('Draw the letter first');
            setShowFeedback(true);
            return;
        }

        if (!isBackendConnected()) {
            setFeedback({ message: 'Cannot connect to server. Tap the status dot to retry.', type: 'error' });
            setShowFeedback(true);
            return;
        }

        if (!isInferenceReady()) {
            setFeedback({
                message: 'Server connected but model not ready. Please wait.',
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
            if (!base64Image) throw new Error('Failed to capture canvas');

            // Send to backend for letter prediction
            const result = await predictLetterDyslexiaFriendlyFromBase64(
                base64Image,
                challenge.correctLetter
            );

            const predictedLetter = result.letter?.toUpperCase() || '';
            const expectedLetter = challenge.correctLetter;

            // Use backend's dyslexia-friendly matching (same as LetterPracticeScreen)
            const isCorrect = result.shouldAccept;



            if (isCorrect) {
                // SUCCESS!
                hapticSuccess();
                const successMessages = [
                    `🎉 Perfect! The ${challenge.ordinalWord.toLowerCase()} letter in "${challenge.numberEntry.word}" is "${expectedLetter}"!`,
                    `⭐ Amazing! "${expectedLetter}" is correct!`,
                    `🌟 You got it! Letter number ${challenge.position} is "${expectedLetter}"!`,
                    `✨ Wonderful! "${expectedLetter}" in position ${challenge.position}!`,
                ];
                const msg = successMessages[Math.floor(Math.random() * successMessages.length)];
                setFeedback({ message: msg, type: 'success' });
                speak(`Perfect! The ${challenge.ordinalWord.toLowerCase()} letter is ${expectedLetter}!`);
                setShowHint(false);
                // Track successful attempt
                await SessionTracker.recordAttempt(
                    'letter_hunt', expectedLetter, predictedLetter, true,
                    `Word: ${challenge.numberEntry.word}, Position: ${challenge.position}`
                );
            } else {
                // TRY AGAIN with helpful hint
                hapticFailure();
                const tryMessages = [
                    `That looks like "${predictedLetter}". The ${challenge.ordinalWord.toLowerCase()} letter is "${expectedLetter}". Try again!`,
                    `Almost! Look at position ${challenge.position} in "${challenge.numberEntry.word}" — it's "${expectedLetter}"!`,
                    `Not quite! Count to position ${challenge.position}: the letter is "${expectedLetter}".`,
                ];
                const msg = tryMessages[Math.floor(Math.random() * tryMessages.length)];
                setFeedback({ message: msg, type: 'error' });
                speak(`Try again! The ${challenge.ordinalWord.toLowerCase()} letter in ${challenge.numberEntry.word} is ${expectedLetter}`);
                setShowHint(true);
                // Track failed attempt
                await SessionTracker.recordAttempt(
                    'letter_hunt', expectedLetter, predictedLetter, false,
                    `Word: ${challenge.numberEntry.word}, Position: ${challenge.position}`
                );
            }
        } catch (error) {
            console.error('Prediction error:', error);
            setFeedback({ message: 'Connection error. Try again!', type: 'error' });
            speak('Something went wrong. Please try again.');
        }

        setIsLoading(false);
        setShowFeedback(true);
    };

    /**
     * Move to the next challenge
     */
    const handleNext = () => {
        let newChallenge = generateChallenge();
        // Avoid identical challenge
        while (
            newChallenge.numberEntry.word === challenge.numberEntry.word &&
            newChallenge.position === challenge.position
        ) {
            newChallenge = generateChallenge();
        }
        setChallenge(newChallenge);
        canvasRef.current?.clear();
        setCanvasKey(prev => prev + 1);
        setShowFeedback(false);
        setShowHint(false);
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
            case 'connected': return colors.statusConnected;
            case 'connecting': return colors.statusConnecting;
            case 'disconnected': return colors.statusDisconnected;
        }
    };

    /**
     * Get a color for each letter box (cycling through palette)
     */
    const getLetterBoxColor = (index: number): string => {
        return LETTER_BOX_COLORS[index % LETTER_BOX_COLORS.length];
    };

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
                {/* HEADER - Mascot with speech bubble */}
                {/* ============================================== */}
                <View style={styles.header}>
                {/* Cartoon mascot */}
                <Text style={[styles.mascot, { fontSize: mascotSize }]}>{mascot}</Text>

                {/* Speech bubble with question */}
                <View style={[styles.speechBubble, { padding: bubblePadding }]}>
                    <View style={styles.bubbleArrow} />
                    <Text style={styles.speechText}>Find the letter! 🔍</Text>

                    {/* Question display - compact inline */}
                    <View style={[styles.questionCard, { padding: questionPad }]}>
                        <Text style={styles.questionText}>
                            What is the{' '}
                            <Text style={styles.highlightText}>
                                {challenge.ordinalWord}
                            </Text>
                            {' '}letter in{' '}
                            <Text style={styles.wordInlineText}>
                                "{challenge.numberEntry.word}"
                            </Text>
                            {' '}?
                        </Text>
                    </View>
                </View>

                {/* Header actions (repeat + status) */}
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.repeatButton}
                        onPress={handleRepeatQuestion}
                    >
                        <Text style={styles.repeatIcon}>🔊</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.statusBadge}
                        onPress={connectionStatus === 'disconnected' ? handleRetryConnection : undefined}
                    >
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ============================================== */}
            {/* LETTER BOXES - Visual word decomposition */}
            {/* ============================================== */}
            <View style={styles.letterBoxSection}>
                <View style={styles.letterBoxRow}>
                    {challenge.numberEntry.word.split('').map((letter, index) => {
                        const isTarget = index === challenge.position - 1;
                        return (
                            <View key={index} style={styles.letterBoxWrapper}>
                                {/* Position number above box */}
                                <Text style={[
                                    styles.positionLabel,
                                    isTarget && styles.positionLabelHighlight,
                                    { fontSize: positionFontSize }
                                ]}>
                                    {index + 1}
                                </Text>

                                {/* Letter box */}
                                <View style={[
                                    styles.letterBox,
                                    { backgroundColor: getLetterBoxColor(index), width: letterBoxSize, height: Math.round(letterBoxSize * 1.08) },
                                    isTarget && styles.letterBoxTarget,
                                ]}>
                                    {isTarget && !showHint ? (
                                        // Show question mark for the target position
                                        <Text style={styles.letterBoxQuestion}>❓</Text>
                                    ) : (
                                        // Show the actual letter
                                        <Text style={[
                                            styles.letterBoxText,
                                            isTarget && showHint && styles.letterBoxHintText,
                                            { fontSize: letterFontSize }
                                        ]}>
                                            {letter}
                                        </Text>
                                    )}
                                </View>

                                {/* Arrow pointer for target */}
                                {isTarget && (
                                    <Text style={styles.targetArrow}>👆</Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* ============================================== */}
            {/* CANVAS SECTION - Drawing area (flex fills space) */}
            {/* ============================================== */}
            <View style={styles.canvasSection}>
                <View style={[styles.canvasWrapper, { width: canvasSize, height: canvasSize }]}>
                    <DrawingCanvas
                        ref={canvasRef}
                        key={canvasKey}
                        canvasHeight={canvasSize}
                        strokeWidth={18}
                        showGuideLines={true}
                    />

                    {/* Clear button inside canvas */}
                    <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                        <Text style={styles.clearIcon}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ============================================== */}
            {/* BOTTOM BUTTONS - Check and Next */}
            {/* ============================================== */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.checkButton, isLoading && styles.buttonDisabled]}
                    onPress={handleCheck}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                        <>
                            <Text style={styles.buttonIcon}>✓</Text>
                            <Text style={styles.buttonText}>Check</Text>
                        </>
                    )}
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
            <FeedbackCard
                message={feedback.message}
                type={feedback.type}
                visible={showFeedback}
                onDismiss={handleFeedbackDismiss}
                autoDismissMs={2500}
            />
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    /**
     * Main container - flex layout (no scroll), same as LetterPracticeScreen
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
        marginBottom: spacing.xs,
    },

    /**
     * Cartoon mascot emoji
     */
    mascot: {
        fontSize: 44,
        marginRight: spacing.sm,
    },

    /**
     * Speech bubble - warm peach theme for this activity
     */
    speechBubble: {
        flex: 1,
        backgroundColor: colors.peachLight,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        alignItems: 'center',
        position: 'relative',
        shadowColor: colors.peach,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },

    /**
     * Bubble arrow pointing to mascot
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
        borderRightColor: colors.peachLight,
    },

    /**
     * "Find the letter!" text
     */
    speechText: {
        fontSize: fontSizes.body,
        color: colors.text,
        fontWeight: fontWeights.semiBold,
        letterSpacing: letterSpacing.normal,
        marginBottom: spacing.xs,
    },

    /**
     * Question card inside the bubble
     */
    questionCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: borderRadius.lg,
        padding: spacing.sm,
        width: '100%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.peach,
    },

    /**
     * Question text
     */
    questionText: {
        fontSize: fontSizes.body,
        color: colors.text,
        fontWeight: fontWeights.regular,
        letterSpacing: letterSpacing.normal,
        textAlign: 'center',
    },

    /**
     * Inline word display within question text
     */
    wordInlineText: {
        fontSize: fontSizes.large,
        fontWeight: fontWeights.extraBold,
        color: colors.primaryDark,
        letterSpacing: letterSpacing.wider,
    },

    /**
     * Highlighted ordinal word (SECOND, THIRD, etc.)
     */
    highlightText: {
        color: colors.primaryDark,
        fontWeight: fontWeights.extraBold,
        fontSize: fontSizes.large,
    },



    /**
     * Letter boxes section
     */
    letterBoxSection: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xs,
        alignItems: 'center',
    },

    /**
     * Row of letter boxes
     */
    letterBoxRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xs,
        flexWrap: 'wrap',
    },

    /**
     * Wrapper for each letter box (includes position label)
     */
    letterBoxWrapper: {
        alignItems: 'center',
        gap: 2,
    },

    /**
     * Position number above letter box
     */
    positionLabel: {
        fontSize: fontSizes.small,
        color: colors.textLight,
        fontWeight: fontWeights.regular,
    },

    /**
     * Highlighted position label for target
     */
    positionLabelHighlight: {
        color: colors.primaryDark,
        fontWeight: fontWeights.extraBold,
        fontSize: fontSizes.body,
    },

    /**
     * Individual letter box
     */
    letterBox: {
        width: 44,
        height: 48,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },

    /**
     * Target letter box with highlighted border
     */
    letterBoxTarget: {
        borderWidth: 3,
        borderColor: colors.orange,
        borderStyle: 'dashed',
        backgroundColor: colors.yellowLight,
        shadowColor: colors.orange,
        shadowOpacity: 0.3,
        elevation: 4,
    },

    /**
     * Letter text in box
     */
    letterBoxText: {
        fontSize: fontSizes.xlarge,
        fontWeight: fontWeights.extraBold,
        color: colors.text,
    },

    /**
     * Question mark for the target position
     */
    letterBoxQuestion: {
        fontSize: 24,
    },

    /**
     * Hint text (revealed after wrong answer)
     */
    letterBoxHintText: {
        color: colors.greenDark,
        fontSize: fontSizes.xlarge + 2,
    },

    /**
     * Arrow pointing to target box
     */
    targetArrow: {
        fontSize: 18,
        marginTop: -2,
    },



    /**
     * Canvas section wrapper - flex: 1 fills remaining space (same as LetterPracticeScreen)
     */
    canvasSection: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
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
     * Clear button inside canvas
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
     * Trash icon
     */
    clearIcon: {
        fontSize: 20,
    },

    /**
     * Score text (shown inline in button container)
     */
    scoreText: {
        fontSize: fontSizes.body,
        fontWeight: fontWeights.semiBold,
        color: colors.orange,
        letterSpacing: letterSpacing.normal,
    },

    /**
     * Bottom button container - pinned at bottom
     */
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        gap: spacing.md,
        alignItems: 'center',
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
     * Next button - warm orange
     */
    nextButton: {
        backgroundColor: colors.orange,
    },

    /**
     * Disabled button state
     */
    buttonDisabled: {
        opacity: 0.6,
    },

    /**
     * Button icon
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

    /**
     * Header actions container
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
});
