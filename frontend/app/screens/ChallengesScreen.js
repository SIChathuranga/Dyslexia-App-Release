import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, TrendingUp, Check, Trophy } from 'lucide-react-native';
import RoundedButton from '../components/ui/RoundedButton';
import { colors, fonts } from '../theme';
import BackButton from '../components/BackButton';

const ChallengesScreen = ({
    onBack,
    onStartPhotoChallenge,
    onStartTodayChallenge,
    onViewProgress,
    todayChallengeWords = [],
    completedChallengeWords = [],
    hasCompletedTodayChallenge = false,
    challengeCurrentIndex = 0,
    challengeActive = false,
}) => {
    const totalWords = todayChallengeWords.length;
    const completedCount = completedChallengeWords.length;
    const activeWordIndex = hasCompletedTodayChallenge
        ? Math.max(totalWords - 1, 0)
        : Math.min(challengeActive ? challengeCurrentIndex : completedCount, Math.max(totalWords - 1, 0));
    const currentWord = totalWords > 0 ? todayChallengeWords[activeWordIndex] : '';
    const primaryButtonLabel = hasCompletedTodayChallenge
        ? "Play Today's Challenge Again"
        : currentWord
            ? `Start With ${currentWord}`
            : "Start Today's Challenge";

    return (
        <LinearGradient
            colors={['#FFF7ED', '#FEF3C7', '#E0F2FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <BackButton onPress={onBack} style={styles.backButton} />
                        <View style={styles.headerText}>
                            <Text style={[styles.title, { fontFamily: fonts.bold }]}>Challenges</Text>
                            <Text style={[styles.subtitle, { fontFamily: fonts.regular }]}>
                                Practice with a fun daily mission
                            </Text>
                        </View>
                    </View>

                    <View style={styles.heroCard}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.heroBadge}>
                                <Trophy size={18} color="#92400E" />
                                <Text style={[styles.heroBadgeText, { fontFamily: fonts.bold }]}>
                                    Today&apos;s Challenge
                                </Text>
                            </View>
                            <View style={styles.progressPill}>
                                <Text style={[styles.progressPillText, { fontFamily: fonts.bold }]}>
                                    {completedCount}/{todayChallengeWords.length} done
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.heroTitle, { fontFamily: fonts.bold }]}>
                            {hasCompletedTodayChallenge
                                ? 'You finished today challenge.'
                                : 'Do one object at a time and unlock the next step.'}
                        </Text>
                        <Text style={[styles.heroDescription, { fontFamily: fonts.regular }]}>
                            {hasCompletedTodayChallenge
                                ? 'You can replay the same 4 objects again if the child wants more practice.'
                                : 'The child will only see the current object. The next object appears after the current one is completed.'}
                        </Text>

                        <View style={styles.currentWordCard}>
                            <Text style={[styles.currentWordLabel, { fontFamily: fonts.bold }]}>
                                {hasCompletedTodayChallenge
                                    ? 'Today challenge completed'
                                    : `Current object ${activeWordIndex + 1}/${totalWords}`}
                            </Text>
                            <Text style={[styles.currentWordText, { fontFamily: fonts.bold }]}>
                                {currentWord || 'Ready'}
                            </Text>
                            <Text style={[styles.currentWordHint, { fontFamily: fonts.regular }]}>
                                {hasCompletedTodayChallenge
                                    ? 'All 4 objects are done.'
                                    : 'Find this object, take a photo, and then say the word correctly.'}
                            </Text>
                        </View>

                        <View style={styles.stepList}>
                            {todayChallengeWords.map((word, index) => {
                                const isCompleted = index < completedCount;
                                const isCurrent = !hasCompletedTodayChallenge && index === activeWordIndex;
                                const showWord = isCompleted || isCurrent || hasCompletedTodayChallenge;

                                return (
                                    <View
                                        key={word}
                                        style={[
                                            styles.stepRow,
                                            isCompleted && styles.stepRowCompleted,
                                            isCurrent && styles.stepRowCurrent,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.stepIndex,
                                                isCompleted && styles.stepIndexCompleted,
                                                isCurrent && styles.stepIndexCurrent,
                                            ]}
                                        >
                                            {isCompleted ? (
                                                <Check size={16} color="#065F46" />
                                            ) : (
                                                <Text style={[styles.stepIndexText, { fontFamily: fonts.bold }]}>
                                                    {index + 1}
                                                </Text>
                                            )}
                                        </View>

                                        <View style={styles.stepTextWrap}>
                                            <Text style={[styles.stepTitle, { fontFamily: fonts.bold }]}>
                                                {showWord ? word : `Step ${index + 1}`}
                                            </Text>
                                            <Text style={[styles.stepSubtitle, { fontFamily: fonts.regular }]}>
                                                {isCompleted
                                                    ? 'Completed'
                                                    : isCurrent
                                                        ? 'Do this object now'
                                                        : 'Unlocks after the current step'}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        <RoundedButton
                            variant={hasCompletedTodayChallenge ? 'success' : 'primary'}
                            size="medium"
                            icon={<Camera size={24} color="#1F2937" />}
                            onPress={onStartTodayChallenge}
                            style={styles.startButton}
                        >
                            {primaryButtonLabel}
                        </RoundedButton>
                    </View>

                    <TouchableOpacity style={styles.actionCard} onPress={onStartPhotoChallenge} activeOpacity={0.85}>
                        <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                            <Camera size={22} color="#1D4ED8" />
                        </View>
                        <View style={styles.actionText}>
                            <Text style={[styles.actionTitle, { fontFamily: fonts.bold }]}>Free Practice</Text>
                            <Text style={[styles.actionSubtitle, { fontFamily: fonts.regular }]}>
                                Take any photo and practice without the daily list.
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={onViewProgress} activeOpacity={0.85}>
                        <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                            <TrendingUp size={22} color="#B45309" />
                        </View>
                        <View style={styles.actionText}>
                            <Text style={[styles.actionTitle, { fontFamily: fonts.bold }]}>View Progress</Text>
                            <Text style={[styles.actionSubtitle, { fontFamily: fonts.regular }]}>
                                Check accuracy, stars, and completed attempts.
                            </Text>
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 26,
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    heroCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 26,
        padding: 22,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 6,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FED7AA',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
    },
    heroBadgeText: {
        fontSize: 13,
        color: '#9A3412',
        marginLeft: 6,
    },
    progressPill: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
    },
    progressPillText: {
        fontSize: 13,
        color: '#1D4ED8',
    },
    heroTitle: {
        fontSize: 24,
        lineHeight: 32,
        color: '#111827',
        marginBottom: 8,
    },
    heroDescription: {
        fontSize: 14,
        lineHeight: 22,
        color: '#4B5563',
        marginBottom: 18,
    },
    currentWordCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 22,
        padding: 18,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    currentWordLabel: {
        fontSize: 13,
        color: '#4F46E5',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    currentWordText: {
        fontSize: 30,
        color: '#111827',
        marginBottom: 6,
    },
    currentWordHint: {
        fontSize: 14,
        lineHeight: 22,
        color: '#6B7280',
    },
    stepList: {
        marginBottom: 18,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    stepRowCompleted: {
        backgroundColor: '#ECFDF5',
        borderColor: '#6EE7B7',
    },
    stepRowCurrent: {
        backgroundColor: '#EEF2FF',
        borderColor: '#A5B4FC',
    },
    stepIndex: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    stepIndexCompleted: {
        backgroundColor: '#D1FAE5',
    },
    stepIndexCurrent: {
        backgroundColor: '#C7D2FE',
    },
    stepIndexText: {
        fontSize: 13,
        color: '#4338CA',
    },
    stepTextWrap: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        color: '#1F2937',
    },
    stepSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 3,
    },
    startButton: {
        marginTop: 6,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderRadius: 22,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    actionText: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 18,
        color: '#111827',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 14,
        lineHeight: 21,
        color: '#6B7280',
    },
});

export default ChallengesScreen;
