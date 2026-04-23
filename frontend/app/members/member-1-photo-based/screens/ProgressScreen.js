import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, TrendingUp, Star, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import Mascot from '../../../components/ui/Mascot';
import ProgressRing from '../../../components/ui/ProgressRing';
import { colors, fonts } from '../../../theme';
import { getProgressStats } from '../services/progressStorage';
import BackButton from '../../../components/BackButton';

const ProgressScreen = ({ onBack, initialViewMode = 'child', childName = 'Learner' }) => {
    const [viewMode, setViewMode] = useState(initialViewMode === 'parent' ? 'parent' : 'child');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProgressStats();
            setStats(data);
        } catch (e) {
            console.error('Failed to load stats:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const handleHearProgressMessage = () => {
        if (stats && !stats.isEmpty) {
            Speech.speak(
                `You've learned ${stats.wordsLearned} words with ${stats.spellingAccuracy} percent accuracy. Keep going!`,
                { language: 'en' }
            );
        } else {
            Speech.speak("Start learning by taking a photo of an object!", { language: 'en' });
        }
    };

    if (loading) {
        return (
            <LinearGradient
                colors={['#E0FFF4', '#EDE9FE', '#FFF0F0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={[styles.safeArea, styles.centerContent]}>
                    <ActivityIndicator size="large" color={colors.purple} />
                    <Text style={[styles.loadingText, { fontFamily: fonts.regular }]}>Loading progress...</Text>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    const isEmpty = !stats || stats.isEmpty;

    // Compute display values
    const wordsLearned = stats?.wordsLearned || 0;
    const wordsTotal = Math.max(stats?.wordsTotal || 1, 1);
    const spellingAccuracy = stats?.spellingAccuracy || 0;
    const weeklyStars = stats?.weeklyStars || 0;
    const weeklyStarsMax = Math.max(stats?.weeklyStarsMax || 1, 1);
    const totalAttempts = stats?.totalAttempts || 0;
    const correctAttempts = stats?.correctAttempts || 0;
    const weeklyProgress = stats?.weeklyProgress || [];

    return (
        <LinearGradient
            colors={['#E0FFF4', '#EDE9FE', '#FFF0F0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Header with View Toggle */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <BackButton onPress={onBack} />
                            <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>Progress</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                onPress={() => setViewMode('child')}
                                style={[
                                    styles.toggleButton,
                                    viewMode === 'child' && styles.toggleButtonActive,
                                ]}
                            >
                                <Text style={[
                                    styles.toggleText,
                                    { fontFamily: fonts.bold },
                                    viewMode === 'child' && styles.toggleTextActive,
                                ]}>
                                    Child View
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setViewMode('parent')}
                                style={[
                                    styles.toggleButton,
                                    viewMode === 'parent' && styles.toggleButtonActiveBlue,
                                ]}
                            >
                                <Text style={[
                                    styles.toggleText,
                                    { fontFamily: fonts.bold },
                                    viewMode === 'parent' && styles.toggleTextActive,
                                ]}>
                                    Parent View
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {viewMode === 'child' ? (
                        /* Child View */
                        <>
                            {/* Profile Section */}
                            <View style={styles.profileCard}>
                                <View style={styles.profileRow}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarEmoji}>👦</Text>
                                    </View>
                                    <Mascot mood="happy" size="small" />
                                </View>
                                <Text style={[styles.greeting, { fontFamily: fonts.bold }]}>
                                    {isEmpty
                                        ? `Welcome, ${childName}! 🎯`
                                        : `Great work today, ${childName}! ⭐`}
                                </Text>
                                <Text style={[styles.greetingSubtitle, { fontFamily: fonts.regular }]}>
                                    {isEmpty
                                        ? 'Start learning by taking a photo!'
                                        : "Here's how you're improving"}
                                </Text>
                            </View>

                            {/* Mascot Speech Bubble */}
                            <View style={styles.speechBubble}>
                                <View style={styles.bubbleArrow} />
                                <View style={styles.bubbleContent}>
                                    <Mascot mood={isEmpty ? "encouraging" : "excited"} size="small" />
                                    <View style={styles.bubbleText}>
                                        <Text style={[styles.bubbleMessage, { fontFamily: fonts.bold }]}>
                                            {isEmpty
                                                ? "Let's start learning new words! 📸"
                                                : "You're improving every day! Keep going 💛"}
                                        </Text>
                                        <TouchableOpacity style={styles.hearButton} onPress={handleHearProgressMessage}>
                                            <Volume2 size={20} color={colors.purple} />
                                            <Text style={[styles.hearText, { fontFamily: fonts.bold }]}>Tap to hear</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {isEmpty ? (
                                /* Empty State */
                                <View style={styles.emptyCard}>
                                    <Text style={[styles.emptyEmoji]}>📷</Text>
                                    <Text style={[styles.emptyTitle, { fontFamily: fonts.bold }]}>
                                        No progress yet
                                    </Text>
                                    <Text style={[styles.emptySubtitle, { fontFamily: fonts.regular }]}>
                                        Take a photo of an object and try saying its name to start tracking your progress!
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {/* Progress Cards */}
                                    <View style={styles.progressRow}>
                                        <View style={styles.progressCard}>
                                            <ProgressRing
                                                progress={(wordsLearned / wordsTotal) * 100}
                                                size={100}
                                                strokeWidth={10}
                                                color="#A78BFA"
                                            />
                                            <BookOpen size={28} color="#8B5CF6" style={styles.cardIcon} />
                                            <Text style={[styles.cardValue, { fontFamily: fonts.bold }]}>{wordsLearned}</Text>
                                            <Text style={[styles.cardLabel, { fontFamily: fonts.bold }]}>Words Learned</Text>
                                        </View>

                                        <View style={styles.progressCard}>
                                            <ProgressRing
                                                progress={(weeklyStars / weeklyStarsMax) * 100}
                                                size={100}
                                                strokeWidth={10}
                                                color="#FBBF24"
                                            />
                                            <Star size={28} color="#F59E0B" fill="#F59E0B" style={styles.cardIcon} />
                                            <Text style={[styles.cardValue, { fontFamily: fonts.bold }]}>{weeklyStars}</Text>
                                            <Text style={[styles.cardLabel, { fontFamily: fonts.bold }]}>Weekly Stars</Text>
                                        </View>
                                    </View>

                                    {/* Spelling Accuracy */}
                                    <View style={styles.accuracyCard}>
                                        <View style={styles.accuracyHeader}>
                                            <View style={styles.accuracyIcon}>
                                                <TrendingUp size={24} color="#059669" />
                                            </View>
                                            <View style={styles.accuracyInfo}>
                                                <Text style={[styles.accuracyTitle, { fontFamily: fonts.bold }]}>Accuracy</Text>
                                                <Text style={[styles.accuracySubtitle, { fontFamily: fonts.regular }]}>
                                                    {correctAttempts} of {totalAttempts} correct
                                                </Text>
                                            </View>
                                            <Text style={[styles.accuracyValue, { fontFamily: fonts.bold }]}>{spellingAccuracy}%</Text>
                                        </View>
                                        <View style={styles.progressBar}>
                                            <LinearGradient
                                                colors={['#34D399', '#FDE047']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={[styles.progressFill, { width: `${spellingAccuracy}%` }]}
                                            />
                                        </View>
                                    </View>
                                </>
                            )}
                        </>
                    ) : (
                        /* Parent View */
                        <>
                            <View style={styles.parentHeader}>
                                <Text style={[styles.parentTitle, { fontFamily: fonts.bold }]}>
                                    {childName}'s Learning Journey
                                </Text>
                                <Text style={[styles.parentSubtitle, { fontFamily: fonts.regular }]}>
                                    Detailed insights into your child's progress
                                </Text>
                            </View>

                            {isEmpty ? (
                                <View style={styles.emptyCard}>
                                    <Text style={[styles.emptyEmoji]}>📊</Text>
                                    <Text style={[styles.emptyTitle, { fontFamily: fonts.bold }]}>
                                        No data yet
                                    </Text>
                                    <Text style={[styles.emptySubtitle, { fontFamily: fonts.regular }]}>
                                        Your child hasn't completed any learning activities yet. Progress will appear here after they practice.
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {/* Summary Stats */}
                                    <View style={styles.parentStatsRow}>
                                        <View style={styles.parentStatCard}>
                                            <Text style={[styles.parentStatValue, { fontFamily: fonts.bold }]}>{totalAttempts}</Text>
                                            <Text style={[styles.parentStatLabel, { fontFamily: fonts.regular }]}>Total Attempts</Text>
                                        </View>
                                        <View style={styles.parentStatCard}>
                                            <Text style={[styles.parentStatValue, { fontFamily: fonts.bold }]}>{correctAttempts}</Text>
                                            <Text style={[styles.parentStatLabel, { fontFamily: fonts.regular }]}>Correct</Text>
                                        </View>
                                        <View style={styles.parentStatCard}>
                                            <Text style={[styles.parentStatValue, { fontFamily: fonts.bold }]}>{spellingAccuracy}%</Text>
                                            <Text style={[styles.parentStatLabel, { fontFamily: fonts.regular }]}>Accuracy</Text>
                                        </View>
                                    </View>

                                    {/* Weekly Accuracy Chart */}
                                    {weeklyProgress.length > 0 && (
                                        <View style={styles.chartCard}>
                                            <View style={styles.chartHeader}>
                                                <TrendingUp size={24} color={colors.blue} />
                                                <Text style={[styles.chartTitle, { fontFamily: fonts.bold }]}>Daily Accuracy (Last 7 Days)</Text>
                                            </View>
                                            {weeklyProgress.map((day) => (
                                                <View key={day.day} style={styles.chartRow}>
                                                    <Text style={[styles.chartDay, { fontFamily: fonts.bold }]}>{day.day}</Text>
                                                    <View style={styles.chartBar}>
                                                        {day.attempts > 0 ? (
                                                            <LinearGradient
                                                                colors={[colors.blue, '#6366F1']}
                                                                start={{ x: 0, y: 0 }}
                                                                end={{ x: 1, y: 0 }}
                                                                style={[styles.chartFill, { width: `${day.accuracy}%` }]}
                                                            >
                                                                <Text style={[styles.chartPercent, { fontFamily: fonts.bold }]}>{day.accuracy}%</Text>
                                                            </LinearGradient>
                                                        ) : (
                                                            <View style={styles.chartEmpty}>
                                                                <Text style={[styles.chartEmptyText, { fontFamily: fonts.regular }]}>—</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </>
                            )}
                        </>
                    )}

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 24, paddingBottom: 48 },
    loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
    header: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    headerTitle: { fontSize: 24, color: '#1F2937' },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: colors.purple,
    },
    toggleButtonActiveBlue: {
        backgroundColor: colors.blue,
    },
    toggleText: { fontSize: 14, color: '#6B7280' },
    toggleTextActive: { color: 'white' },
    profileCard: {
        backgroundColor: '#EDE9FE',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FCD34D',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarEmoji: { fontSize: 40 },
    greeting: { fontSize: 22, color: '#581C87', marginBottom: 4 },
    greetingSubtitle: { fontSize: 16, color: '#7C3AED' },
    speechBubble: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    bubbleArrow: {
        position: 'absolute',
        top: -10,
        left: 32,
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'white',
    },
    bubbleContent: { flexDirection: 'row', alignItems: 'flex-start' },
    bubbleText: { flex: 1, marginLeft: 12 },
    bubbleMessage: { fontSize: 16, color: '#1F2937', marginBottom: 8 },
    hearButton: { flexDirection: 'row', alignItems: 'center' },
    hearText: { fontSize: 14, color: colors.purple, marginLeft: 8 },
    emptyCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyEmoji: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 20, color: '#1F2937', marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
    progressRow: { flexDirection: 'row', marginBottom: 16 },
    progressCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardIcon: { marginTop: 12 },
    cardValue: { fontSize: 28, color: '#1F2937', marginTop: 8 },
    cardLabel: { fontSize: 12, color: '#6B7280' },
    accuracyCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    accuracyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    accuracyIcon: { backgroundColor: '#D1FAE5', padding: 12, borderRadius: 16 },
    accuracyInfo: { flex: 1, marginLeft: 12 },
    accuracyTitle: { fontSize: 18, color: '#1F2937' },
    accuracySubtitle: { fontSize: 12, color: '#6B7280' },
    accuracyValue: { fontSize: 28, color: '#059669' },
    progressBar: {
        height: 16,
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 8 },
    parentHeader: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    parentTitle: { fontSize: 22, color: '#1F2937', marginBottom: 4 },
    parentSubtitle: { fontSize: 14, color: '#6B7280' },
    parentStatsRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    parentStatCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    parentStatValue: { fontSize: 24, color: colors.blue, marginBottom: 4 },
    parentStatLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
    chartCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    chartTitle: { fontSize: 18, color: '#1F2937', marginLeft: 12 },
    chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    chartDay: { width: 40, fontSize: 14, color: '#6B7280' },
    chartBar: {
        flex: 1,
        height: 32,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        overflow: 'hidden',
    },
    chartFill: {
        height: '100%',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 12,
    },
    chartPercent: { fontSize: 12, color: 'white' },
    chartEmpty: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartEmptyText: { fontSize: 12, color: '#9CA3AF' },

});

export default ProgressScreen;
