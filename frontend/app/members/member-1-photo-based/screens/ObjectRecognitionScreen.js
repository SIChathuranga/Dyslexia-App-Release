import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Home, Volume2 } from 'lucide-react-native';
import Mascot from '../../../components/ui/Mascot';
import PhonemeSegment from '../../../components/ui/PhonemeSegment';
import RoundedButton from '../../../components/ui/RoundedButton';
import { colors, fonts } from '../../../theme';
import { getSyllablesWithColors } from '../../../utils/syllableUtils';
import * as Speech from 'expo-speech';

const ObjectRecognitionScreen = ({
    detectedObject,
    onStartChallenge,
    onHome,
    challengeWord = null,
    challengeIndex = 0,
    challengeTotal = 0,
    completedChallengeCount = 0,
}) => {
    const { label = 'APPLE', imageUri } = detectedObject || {};
    const phonemes = getSyllablesWithColors(label);
    const isChallengeMode = Boolean(challengeWord);

    const speakWord = () => {
        if (!label) return;
        Speech.stop();
        Speech.speak(label, { language: 'en', rate: 0.85, pitch: 1.0 });
    };

    useEffect(() => {
        speakWord();
    }, [label]);

    return (
        <LinearGradient
            colors={['#D1FAE5', '#DBEAFE', '#E9D8FD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Home Button */}
                <TouchableOpacity style={styles.homeButton} onPress={onHome}>
                    <Home size={24} color="#581C87" />
                </TouchableOpacity>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.mascotContainer}>
                        <Mascot mood="excited" size="medium" />
                    </View>

                    <View style={styles.card}>
                        {isChallengeMode && (
                            <View style={styles.challengeBanner}>
                                <Text style={[styles.challengeBannerLabel, { fontFamily: fonts.bold }]}>
                                    Today&apos;s Challenge
                                </Text>
                                <Text style={[styles.challengeBannerText, { fontFamily: fonts.regular }]}>
                                    Word {challengeIndex + 1} of {challengeTotal} • {completedChallengeCount} done
                                </Text>
                            </View>
                        )}

                        <View style={styles.cardHeader}>
                            <Text style={[styles.foundLabel, { fontFamily: fonts.regular }]}>I found:</Text>
                            <Text style={[styles.objectName, { fontFamily: fonts.bold }]}>{label}</Text>
                        </View>

                        <View style={styles.imageWrapper}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.objectImage} />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <Text style={styles.placeholderEmoji}>📷</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.phonemeSection}>
                            <Text style={[styles.breakdownLabel, { fontFamily: fonts.bold }]}>
                                Let's break it down:
                            </Text>

                            <View style={styles.phonemeRow}>
                                {phonemes.map((phoneme, index) => (
                                    <React.Fragment key={index}>
                                        <PhonemeSegment
                                            phoneme={phoneme.text}
                                            color={phoneme.color}
                                            index={index}
                                        />
                                        {index < phonemes.length - 1 && (
                                            <Text style={styles.phonemeDot}>•</Text>
                                        )}
                                    </React.Fragment>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.listenButton} onPress={speakWord} activeOpacity={0.8}>
                                <Volume2 size={20} color="#4C1D95" />
                                <Text style={[styles.listenButtonText, { fontFamily: fonts.bold }]}>
                                    Listen
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.instructionBox}>
                            <Text style={[styles.instructionText, { fontFamily: fonts.bold }]}>
                                Now, say the word out loud! 🎤
                            </Text>
                        </View>
                    </View>

                    <View style={styles.buttonContainer}>
                        <RoundedButton
                            variant="primary"
                            size="large"
                            icon={<Mic size={28} color="#553C9A" />}
                            onPress={onStartChallenge}
                        >
                            Tap to Speak
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
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    challengeBanner: {
        backgroundColor: '#FEF3C7',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#FCD34D',
    },
    challengeBannerLabel: {
        fontSize: 15,
        color: '#92400E',
        textAlign: 'center',
    },
    challengeBannerText: {
        fontSize: 13,
        color: '#78350F',
        textAlign: 'center',
        marginTop: 4,
    },
    cardHeader: { alignItems: 'center', marginBottom: 12 },
    foundLabel: { fontSize: 14, color: colors.purple },
    objectName: { fontSize: 28, color: '#581C87' },
    imageWrapper: {
        backgroundColor: '#F3E8FF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
    },
    objectImage: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: '100%',
        height: 160,
        borderRadius: 12,
        backgroundColor: '#E9D8FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderEmoji: { fontSize: 48 },
    phonemeSection: { marginBottom: 16 },
    breakdownLabel: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 12,
    },
    phonemeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
    },
    phonemeDot: { fontSize: 24, color: '#9CA3AF', marginHorizontal: 6 },
    listenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 12,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: '#EDE9FE',
        borderWidth: 2,
        borderColor: '#DDD6FE',
    },
    listenButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#4C1D95',
    },
    instructionBox: {
        backgroundColor: '#EDE9FE',
        borderRadius: 16,
        padding: 14,
        borderWidth: 2,
        borderColor: '#DDD6FE',
    },
    instructionText: { fontSize: 16, color: '#581C87', textAlign: 'center' },
    buttonContainer: { marginTop: 20 },
});

export default ObjectRecognitionScreen;
