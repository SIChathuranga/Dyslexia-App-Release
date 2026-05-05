// ErrorScreen — shown when the child's spelling attempt was wrong; gives a syllable hint and retry option
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { RotateCcw, Lightbulb, Home } from 'lucide-react-native';
import Mascot from '../../../components/ui/Mascot';
import PhonemeSegment from '../../../components/ui/PhonemeSegment';
import RoundedButton from '../../../components/ui/RoundedButton';
import { colors, fonts } from '../../../theme';
import * as Speech from 'expo-speech';
import { getSyllablesWithColors } from '../../../utils/syllableUtils';

// Props:
//   detectedObject — the object the child was trying to spell ({ label })
//   onRetry        — go back to SpeakNowScreen to try again
//   onHome         — exit back to home / exit challenge
const ErrorScreen = ({ detectedObject, onRetry, onHome }) => {
    const { label = 'APPLE' } = detectedObject || {};

    // Split word into colour-coded syllables e.g. "AP" "PLE" with different colours
    const phonemeHints = getSyllablesWithColors(label);

    // Speak an encouraging message as soon as this screen appears
    React.useEffect(() => {
        Speech.speak("Almost there! Let's try again together.", { language: 'en' });
    }, []);

    return (
        <LinearGradient
            colors={['#FFE4B5', '#FED7E2', '#F5DEB3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Home button — absolute top-left */}
                <TouchableOpacity style={styles.homeButton} onPress={onHome}>
                    <Home size={24} color="#C2410C" />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Encouraging mascot */}
                    <View style={styles.mascotContainer}>
                        <Mascot mood="encouraging" size="medium" />
                    </View>

                    {/* Message card */}
                    <View style={styles.messageCard}>
                        <Lightbulb size={48} color="#F59E0B" style={styles.lightbulb} />
                        <Text style={[styles.title, { fontFamily: fonts.bold }]}>
                            Almost there!
                        </Text>
                        <Text style={[styles.subtitle, { fontFamily: fonts.regular }]}>
                            Let's try again together. 💛
                        </Text>
                    </View>

                    {/* Hint card — word broken into colour-coded syllables */}
                    <View style={styles.hintsCard}>
                        <View style={styles.hintsHeader}>
                            <View style={styles.hintIcon}>
                                <Lightbulb size={20} color="#B45309" />
                            </View>
                            <Text style={[styles.hintsTitle, { fontFamily: fonts.bold }]}>
                                Hint:
                            </Text>
                        </View>

                        <Text style={[styles.hintsSubtitle, { fontFamily: fonts.regular }]}>
                            Remember these sounds:
                        </Text>

                        {/* Each PhonemeSegment is one syllable with a unique background colour */}
                        <View style={styles.phonemeRow}>
                            {phonemeHints.map((phoneme, index) => (
                                <React.Fragment key={index}>
                                    <PhonemeSegment
                                        phoneme={phoneme.text}
                                        color={phoneme.color}
                                        index={index}
                                    />
                                    {index < phonemeHints.length - 1 && (
                                        <Text style={styles.phonemeDot}>•</Text>
                                    )}
                                </React.Fragment>
                            ))}
                        </View>

                        <View style={styles.encourageBox}>
                            <Text style={[styles.encourageText, { fontFamily: fonts.bold }]}>
                                You can do this! 🌟
                            </Text>
                        </View>
                    </View>

                    {/* Retry button — navigates back to SpeakNowScreen */}
                    <View style={styles.buttonContainer}>
                        <RoundedButton
                            variant="gentle"
                            size="large"
                            icon={<RotateCcw size={24} color="#702459" />}
                            onPress={onRetry}
                        >
                            Try Again
                        </RoundedButton>
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
    scrollContent: { padding: 20, paddingTop: 60 },
    mascotContainer: { alignItems: 'center', marginBottom: 12 },
    messageCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 16,
    },
    lightbulb: { marginBottom: 12 },
    title: { fontSize: 24, color: '#C2410C', marginBottom: 6 },
    subtitle: { fontSize: 16, color: '#1F2937', textAlign: 'center' },
    hintsCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 20,
    },
    hintsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    hintIcon: { backgroundColor: '#FEF3C7', padding: 10, borderRadius: 12, marginRight: 10 },
    hintsTitle: { fontSize: 18, color: '#1F2937' },
    hintsSubtitle: { fontSize: 14, color: '#374151', textAlign: 'center', marginBottom: 12 },
    phonemeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    phonemeDot: { fontSize: 24, color: '#9CA3AF', marginHorizontal: 10 },
    encourageBox: {
        backgroundColor: '#EDE9FE',
        borderWidth: 3,
        borderColor: '#DDD6FE',
        borderRadius: 16,
        padding: 14,
    },
    encourageText: { fontSize: 16, color: '#581C87', textAlign: 'center' },
    buttonContainer: { marginTop: 8 },
});

export default ErrorScreen;
