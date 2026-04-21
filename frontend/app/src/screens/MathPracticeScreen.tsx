import { Text } from '../components/DyslexicText';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
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
import {
    isDigitBackendConnected,
    loadMathModel,
    predictDigitFromBase64
} from '../ml/mathSymbolModel';
import { speak } from '../tts/speak';
import { SessionTracker } from '../services/SessionTracker';
import { hapticSuccess, hapticFailure } from '../services/HapticFeedback';

// Fun cartoon mascots for math
const MATH_MASCOTS = ['🤖', '🦉', '🐙', '🦋', '🐢', '🦄', '🐝', '🌟'];

interface MathProblem {
    equation: string;
    spokenEquation: string;
    answer: number;
}

const generateMathProblem = (): MathProblem => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let num1: number, num2: number, answer: number;

    if (operation === '+') {
        num1 = Math.floor(Math.random() * 5) + 1;
        num2 = Math.floor(Math.random() * (10 - num1));
        answer = num1 + num2;
    } else if (operation === '-') {
        num1 = Math.floor(Math.random() * 5) + 5;
        num2 = Math.floor(Math.random() * (num1 + 1));
        answer = num1 - num2;
    } else {
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

    let opWord = operation === '+' ? 'plus' : operation === '-' ? 'minus' : 'times';
    const displayOperation = operation === '*' ? '×' : operation;

    return {
        equation: `${num1} ${displayOperation} ${num2} = ?`,
        spokenEquation: `${num1} ${opWord} ${num2}`,
        answer
    };
};

export const MathPracticeScreen: React.FC = () => {
    const getRandomMascot = () => {
        return MATH_MASCOTS[Math.floor(Math.random() * MATH_MASCOTS.length)];
    };

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

    const [problem, setProblem] = useState<MathProblem>(generateMathProblem());
    const [mascot] = useState(getRandomMascot());
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'neutral' }>({
        message: '',
        type: 'neutral',
    });
    const [showFeedback, setShowFeedback] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [canvasKey, setCanvasKey] = useState(0);

    const canvasRef = useRef<DrawingCanvasRef>(null);

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

    const handleFeedbackDismiss = () => {
        setShowFeedback(false);
    };

    const handleCheck = async () => {
        if (!canvasRef.current) return;

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
            const base64Image = await canvasRef.current.captureAsBase64();
            const prediction = await predictDigitFromBase64(base64Image);
            const expectedAnswer = problem.answer.toString();
            const isCorrect = prediction.digit === expectedAnswer;

            if (isCorrect) {
                hapticSuccess();
                setFeedback({
                    message: `Correct! ${problem.equation.replace('?', expectedAnswer)}`,
                    type: 'success'
                });
                speak('Correct!');
                await SessionTracker.recordAttempt(
                    'math_practice', expectedAnswer, prediction.digit, true, problem.equation
                );
            } else {
                hapticFailure();
                setFeedback({
                    message: `Answer is ${expectedAnswer}`,
                    type: 'error'
                });
                speak(`The answer is ${expectedAnswer}`);
                await SessionTracker.recordAttempt(
                    'math_practice', expectedAnswer, prediction.digit, false, problem.equation
                );
            }
        } catch {
            setFeedback({ message: 'Connection error', type: 'error' });
        }

        setIsLoading(false);
        setShowFeedback(true);
    };

    const handleClear = () => {
        canvasRef.current?.clear();
        setCanvasKey(prev => prev + 1);
        setShowFeedback(false);
    };

    const handleNext = () => {
        const newProblem = generateMathProblem();
        setProblem(newProblem);
        setShowFeedback(false);
        canvasRef.current?.clear();
        setCanvasKey(prev => prev + 1);
        speak(`Solve: ${newProblem.spokenEquation}`);
        SessionTracker.startChallenge(newProblem.answer.toString());
    };

    const handleRetryConnection = async () => {
        setConnectionStatus('connecting');
        setIsModelLoading(true);
        await loadMathModel();
        setIsModelLoading(false);
        setConnectionStatus(isDigitBackendConnected() ? 'connected' : 'disconnected');
    };

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return colors.statusConnected;
            case 'connecting': return colors.statusConnecting;
            case 'disconnected': return colors.statusDisconnected;
        }
    };

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
                {/* Header with mascot and prominent equation */}
                <View style={styles.header}>
                {/* Mascot */}
                <Text style={[styles.mascot, { fontSize: mascotSize }]}>{mascot}</Text>

                {/* Speech bubble with equation */}
                <View style={[styles.speechBubble, { padding: bubblePadding }]}>
                    <View style={styles.bubbleArrow} />
                    <Text style={styles.speechText}>Solve this!</Text>
                    <View style={[styles.equationContainer, { paddingHorizontal: eqPadH, paddingVertical: eqPadV }]}>
                        <Text style={[styles.equationText, { fontSize: equationFontSize }]}>{problem.equation}</Text>
                    </View>
                </View>

                {/* Status */}
                <TouchableOpacity
                    style={styles.statusBadge}
                    onPress={connectionStatus === 'disconnected' ? handleRetryConnection : undefined}
                >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                </TouchableOpacity>
            </View>

            {/* Canvas with Clear button inside */}
            <View style={styles.canvasSection}>
            <View style={[styles.canvasWrapper, { width: canvasSize, height: canvasSize }]}>
                    <DrawingCanvas
                        ref={canvasRef}
                        key={canvasKey}
                        canvasHeight={canvasSize}
                        strokeWidth={14}
                        showGuideLines={false}
                    />

                    {/* Clear button - inside canvas top right */}
                    <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                        <Text style={styles.clearIcon}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>

                {/* Bottom Buttons */}
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

            {/* Feedback Overlay */}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: spacing.lg,
    },
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
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        marginBottom: spacing.xs,
    },
    mascot: {
        fontSize: 48,
        marginRight: spacing.sm,
    },
    speechBubble: {
        flex: 1,
        backgroundColor: colors.purpleLight,  // Dyslexia purple for math
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
    speechText: {
        fontSize: fontSizes.body,
        color: colors.text,
        fontWeight: fontWeights.semiBold,
        letterSpacing: letterSpacing.normal,
        marginBottom: spacing.xs,
    },
    equationContainer: {
        backgroundColor: colors.yellowLight,  // Dyslexia yellow - good for highlighting
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
    equationText: {
        fontSize: 40,
        fontWeight: fontWeights.extraBold,
        color: colors.text,
        letterSpacing: letterSpacing.wide,
    },
    statusBadge: {
        marginLeft: spacing.sm,
        marginTop: spacing.sm,
    },
    statusDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: colors.cardBackground,
    },
    canvasSection: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
    },
    canvasWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
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
    clearIcon: {
        fontSize: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.md,
        backgroundColor: colors.background,
    },
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
    checkButton: {
        backgroundColor: colors.green,  // Dyslexia green
    },
    nextButton: {
        backgroundColor: colors.blue,   // Dyslexia blue
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonIcon: {
        fontSize: 24,
        color: colors.text,
        fontWeight: fontWeights.bold,
    },
    buttonText: {
        fontSize: fontSizes.large,
        fontWeight: fontWeights.bold,
        color: colors.text,
        letterSpacing: letterSpacing.normal,
    },
});
