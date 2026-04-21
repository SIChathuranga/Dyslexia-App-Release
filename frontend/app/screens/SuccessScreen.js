import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Home } from 'lucide-react-native';
import Mascot from '../components/ui/Mascot';
import RoundedButton from '../components/ui/RoundedButton';
import { colors, fonts } from '../theme';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

const SuccessScreen = ({
    onContinue,
    onHome,
    challengeMode = false,
    completedCount = 0,
    totalCount = 0,
    isFinalChallengeWord = false,
    nextWord = null,
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const starAnims = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;
    const confettiAnims = useRef(
        Array(15).fill(0).map(() => ({
            y: new Animated.Value(-50),
            x: Math.random() * width,
            rotation: new Animated.Value(0),
        }))
    ).current;
    const title = challengeMode
        ? (isFinalChallengeWord ? 'Challenge Complete!' : 'Word Complete!')
        : 'Great Job!';
    const subtitle = challengeMode
        ? (
            isFinalChallengeWord
                ? `You finished all ${totalCount} words for today!`
                : `You completed ${completedCount} of ${totalCount} words.`
        )
        : 'You spelled it correctly! 🎊';
    const highlightText = challengeMode
        ? (
            isFinalChallengeWord
                ? `All ${totalCount} challenge words are done`
                : `Next word: ${nextWord}`
        )
        : '+10 points';
    const bottomMessage = challengeMode
        ? (
            isFinalChallengeWord
                ? 'Come back tomorrow for a new set of words.'
                : 'Ready for the next photo challenge?'
        )
        : "You're becoming a spelling star! ⭐";
    const continueLabel = challengeMode
        ? (isFinalChallengeWord ? 'Back to Challenges' : 'Next Word')
        : 'Continue 🚀';

    useEffect(() => {
        const speechMessage = challengeMode
            ? (
                isFinalChallengeWord
                    ? 'Amazing work! You finished today challenge.'
                    : 'Great job! Let us do the next word.'
            )
            : 'Great job! You spelled it correctly!';

        Speech.speak(speechMessage, { language: 'en' });

        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
        }).start();

        starAnims.forEach((anim, index) => {
            Animated.spring(anim, {
                toValue: 1,
                tension: 50,
                friction: 5,
                delay: 600 + index * 100,
                useNativeDriver: true,
            }).start();
        });

        confettiAnims.forEach((confetti) => {
            Animated.loop(
                Animated.parallel([
                    Animated.timing(confetti.y, {
                        toValue: height + 50,
                        duration: 2500 + Math.random() * 1500,
                        delay: Math.random() * 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(confetti.rotation, {
                        toValue: 360,
                        duration: 2500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    }, [challengeMode, isFinalChallengeWord, scaleAnim, starAnims, confettiAnims]);

    const confettiColors = [colors.yellow, colors.error, colors.turquoise, colors.green, colors.purple];

    return (
        <LinearGradient
            colors={[colors.green, colors.turquoise, colors.blueGrey]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Confetti */}
            {confettiAnims.map((confetti, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.confetti,
                        {
                            left: confetti.x,
                            transform: [
                                { translateY: confetti.y },
                                {
                                    rotate: confetti.rotation.interpolate({
                                        inputRange: [0, 360],
                                        outputRange: ['0deg', '360deg'],
                                    })
                                },
                            ],
                            backgroundColor: confettiColors[index % confettiColors.length],
                        },
                    ]}
                />
            ))}

            <SafeAreaView style={styles.safeArea}>
                {/* Home Button */}
                <TouchableOpacity style={styles.homeButton} onPress={onHome}>
                    <Home size={24} color="#059669" />
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[
                        styles.mascotContainer,
                        { transform: [{ scale: scaleAnim }] }
                    ]}>
                        <Mascot mood="excited" size="medium" />
                    </Animated.View>

                    <View style={styles.card}>
                        <Text style={styles.celebrationEmoji}>🎉</Text>

                        <Text style={[styles.title, { fontFamily: fonts.bold }]}>
                            {title}
                        </Text>

                        <Text style={[styles.subtitle, { fontFamily: fonts.regular }]}>
                            {subtitle}
                        </Text>

                        <View style={styles.starsRow}>
                            {starAnims.map((anim, index) => (
                                <Animated.View
                                    key={index}
                                    style={{ transform: [{ scale: anim }] }}
                                >
                                    <Star
                                        size={44}
                                        color={colors.yellow}
                                        fill={colors.yellow}
                                        style={styles.star}
                                    />
                                </Animated.View>
                            ))}
                        </View>

                        <View style={styles.pointsBox}>
                            <Text style={[styles.pointsText, { fontFamily: fonts.bold }]}>
                                {challengeMode ? 'Keep going: ' : 'You earned '}
                                <Text style={styles.pointsHighlight}>{highlightText}</Text>
                                {!challengeMode ? '! 🌟' : ''}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <RoundedButton
                            variant="primary"
                            size="large"
                            onPress={onContinue}
                        >
                            {continueLabel}
                        </RoundedButton>
                    </View>

                    <View style={styles.messageBox}>
                        <Text style={[styles.messageText, { fontFamily: fonts.bold }]}>
                            {bottomMessage}
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    homeButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 12,
        borderRadius: 16,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    confetti: { position: 'absolute', width: 12, height: 12, borderRadius: 3 },
    mascotContainer: { alignItems: 'center', marginBottom: 12 },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 3,
        borderColor: colors.green,
    },
    celebrationEmoji: { fontSize: 48, marginBottom: 12 },
    title: { fontSize: 32, color: '#1F2937', marginBottom: 6 },
    subtitle: { fontSize: 18, color: '#374151', marginBottom: 20, textAlign: 'center' },
    starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
    star: { marginHorizontal: 6 },
    pointsBox: {
        backgroundColor: colors.yellow,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderWidth: 3,
        borderColor: '#FCD34D',
    },
    pointsText: { fontSize: 16, color: '#1F2937', textAlign: 'center' },
    pointsHighlight: { fontSize: 20, color: '#1F2937' },
    buttonContainer: { marginTop: 20 },
    messageBox: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
        padding: 16,
        marginTop: 16,
        borderWidth: 3,
        borderColor: colors.green,
    },
    messageText: { fontSize: 16, color: '#1F2937', textAlign: 'center' },
});

export default SuccessScreen;
