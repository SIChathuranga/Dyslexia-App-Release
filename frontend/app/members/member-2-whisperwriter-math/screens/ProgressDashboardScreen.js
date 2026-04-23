/**
 * ================================================================================
 * PROGRESS DASHBOARD SCREEN
 * ================================================================================
 *
 * Comprehensive data visualization and analysis screen for dyslexia patient
 * progress monitoring. This screen is designed for PARENTS/GUARDIANS to
 * understand their child's learning journey across all 4 activities.
 *
 * SECTIONS:
 * ---------
 * 1. Overview Header - Total stats, streak, overall accuracy
 * 2. Activity Breakdown - Per-activity accuracy rings & stats
 * 3. Weekly Progress Chart - Bar chart showing accuracy trend over 8 weeks
 * 4. Confusion Analysis - Most commonly confused letters/numbers
 * 5. Response Time Analysis - Average response times per activity
 * 6. Parent Suggestions - AI-generated improvement recommendations
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import { Text } from '../components/DyslexicText';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, borderRadius, fontSizes, fontWeights, letterSpacing, } from '../theme/colors';
import { SessionTracker, ACTIVITY_DISPLAY_NAMES, ACTIVITY_EMOJIS, ACTIVITY_COLORS, } from '../services/SessionTracker';
// ============================================================================
// CONSTANTS
// ============================================================================
const BAR_CHART_HEIGHT = 180;
// Color palette for the dashboard
const DASHBOARD_COLORS = {
    cardBg: '#FFFFFF',
    gradientStart: '#96ADFC',
    gradientEnd: '#B987DC',
    barActive: '#96ADFC',
    barInactive: '#EEF1F8',
    ringBg: '#F0F0F0',
    improving: '#7AD66A',
    stable: '#EDDD6D',
    declining: '#E0A6AA',
    strength: '#C5F7BB',
    improvement: '#F0C8CB',
    practice: '#F5E4CE',
    encouragement: '#B8C8FD',
};
// ============================================================================
// HELPER COMPONENTS
// ============================================================================
/**
 * Animated SVG Circle wrapper — allows Animated.Value to drive strokeDashoffset
 */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
/**
 * Circular progress ring with smooth SVG animation for accuracy visualization.
 * Uses react-native-svg for pixel-perfect arcs and Animated API for
 * a satisfying fill animation from 0 → target percentage.
 */
const AccuracyRing = ({ percentage, size, strokeWidth, color, label, sublabel }) => {
    const fillPercentage = Math.min(Math.max(percentage, 0), 100);
    // SVG math
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const targetOffset = circumference - (circumference * fillPercentage) / 100;
    // Animated value for the dash-offset (starts fully hidden)
    const animatedOffset = useRef(new Animated.Value(circumference)).current;
    // Animated value for the displayed number
    const animatedNumber = useRef(new Animated.Value(0)).current;
    const [displayPercent, setDisplayPercent] = useState(0);
    useEffect(() => {
        // Animate ring fill
        Animated.timing(animatedOffset, {
            toValue: targetOffset,
            duration: 1200,
            useNativeDriver: false, // strokeDashoffset not supported by native driver
        }).start();
        // Animate number counter
        Animated.timing(animatedNumber, {
            toValue: fillPercentage,
            duration: 1200,
            useNativeDriver: false,
        }).start();
        // Listen to animated value changes to update displayed text
        const listenerId = animatedNumber.addListener(({ value }) => {
            setDisplayPercent(Math.round(value));
        });
        return () => {
            animatedNumber.removeListener(listenerId);
        };
    }, [fillPercentage]);
    // Dynamic font size based on ring size
    const percentFontSize = size <= 80 ? 16 : size <= 120 ? fontSizes.large : fontSizes.xlarge;
    return (<View style={{ alignItems: 'center' }}>
            <View style={[
            ringStyles.container,
            { width: size, height: size },
        ]}>
                <Svg width={size} height={size}>
                    {/* Background track */}
                    <Circle cx={size / 2} cy={size / 2} r={radius} stroke={DASHBOARD_COLORS.ringBg} strokeWidth={strokeWidth} fill="none"/>

                    {/* Animated foreground arc */}
                    <AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={animatedOffset} rotation="-90" origin={`${size / 2}, ${size / 2}`}/>
                </Svg>

                {/* Center text */}
                <View style={ringStyles.centerContent}>
                    <Text style={[
            ringStyles.percentage,
            { color, fontSize: percentFontSize },
        ]}>
                        {displayPercent}%
                    </Text>
                </View>
            </View>
            {label && <Text style={ringStyles.label}>{label}</Text>}
            {sublabel && <Text style={ringStyles.sublabel}>{sublabel}</Text>}
        </View>);
};
const ringStyles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    centerContent: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentage: {
        fontWeight: fontWeights.extraBold,
        letterSpacing: letterSpacing.normal,
    },
    label: {
        marginTop: spacing.xs,
        fontSize: fontSizes.small,
        fontWeight: fontWeights.semiBold,
        color: colors.text,
        textAlign: 'center',
        letterSpacing: letterSpacing.normal,
    },
    sublabel: {
        fontSize: 12,
        color: colors.textLight,
        textAlign: 'center',
    },
});
/**
 * Horizontal bar chart for weekly progress
 */
const WeeklyBarChart = ({ data }) => {
    return (<View style={barChartStyles.container}>
            {/* Y-axis labels */}
            <View style={barChartStyles.yAxis}>
                <Text style={barChartStyles.yLabel}>100%</Text>
                <Text style={barChartStyles.yLabel}>50%</Text>
                <Text style={barChartStyles.yLabel}>0%</Text>
            </View>

            {/* Bars */}
            <View style={barChartStyles.barsContainer}>
                {/* Grid lines */}
                <View style={[barChartStyles.gridLine, { top: 0 }]}/>
                <View style={[barChartStyles.gridLine, { top: '50%' }]}/>
                <View style={[barChartStyles.gridLine, { bottom: 0 }]}/>

                {data.map((item, index) => {
            const barHeight = (item.value / 100) * BAR_CHART_HEIGHT;
            const hasData = item.count > 0;
            return (<View key={index} style={barChartStyles.barWrapper}>
                            <View style={barChartStyles.barColumn}>
                                <View style={[
                    barChartStyles.bar,
                    {
                        height: hasData ? Math.max(barHeight, 4) : 4,
                        backgroundColor: hasData
                            ? DASHBOARD_COLORS.barActive
                            : DASHBOARD_COLORS.barInactive,
                        borderRadius: 4,
                    }
                ]}/>
                            </View>
                            <Text style={barChartStyles.xLabel}>{item.label}</Text>
                            {hasData && (<Text style={barChartStyles.barValue}>
                                    {item.value.toFixed(0)}%
                                </Text>)}
                        </View>);
        })}
            </View>
        </View>);
};
const barChartStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: BAR_CHART_HEIGHT + 40,
        paddingTop: spacing.sm,
    },
    yAxis: {
        width: 36,
        height: BAR_CHART_HEIGHT,
        justifyContent: 'space-between',
        paddingRight: spacing.xs,
    },
    yLabel: {
        fontSize: 10,
        color: colors.textLight,
        textAlign: 'right',
    },
    barsContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: BAR_CHART_HEIGHT,
        position: 'relative',
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#E8E8E8',
    },
    barWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    barColumn: {
        width: '70%',
        height: BAR_CHART_HEIGHT,
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
    },
    xLabel: {
        fontSize: 10,
        color: colors.textLight,
        marginTop: 4,
        fontWeight: fontWeights.regular,
    },
    barValue: {
        fontSize: 9,
        color: colors.text,
        fontWeight: fontWeights.semiBold,
        marginTop: 1,
    },
});
/**
 * Trend indicator badge
 */
const TrendBadge = ({ trend }) => {
    const config = {
        improving: { icon: '📈', text: 'Improving', color: DASHBOARD_COLORS.improving },
        stable: { icon: '➡️', text: 'Stable', color: DASHBOARD_COLORS.stable },
        declining: { icon: '📉', text: 'Needs Attention', color: DASHBOARD_COLORS.declining },
    };
    const c = config[trend];
    return (<View style={[trendStyles.badge, { backgroundColor: c.color + '30' }]}>
            <Text style={trendStyles.icon}>{c.icon}</Text>
            <Text style={[trendStyles.text, { color: c.color === DASHBOARD_COLORS.stable ? '#8B7800' : c.color }]}>
                {c.text}
            </Text>
        </View>);
};
const trendStyles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.round,
        gap: 4,
    },
    icon: {
        fontSize: 12,
    },
    text: {
        fontSize: 11,
        fontWeight: fontWeights.semiBold,
    },
});
/**
 * Suggestion card component
 */
const SuggestionCard = ({ suggestion }) => {
    const bgColors = {
        strength: DASHBOARD_COLORS.strength,
        improvement: DASHBOARD_COLORS.improvement,
        practice: DASHBOARD_COLORS.practice,
        encouragement: DASHBOARD_COLORS.encouragement,
    };
    return (<View style={[suggestionStyles.card, { backgroundColor: bgColors[suggestion.category] }]}>
            <View style={suggestionStyles.header}>
                <Text style={suggestionStyles.icon}>{suggestion.icon}</Text>
                <Text style={suggestionStyles.title}>{suggestion.title}</Text>
            </View>
            <Text style={suggestionStyles.message}>{suggestion.message}</Text>
            {suggestion.relatedActivity && (<View style={suggestionStyles.activityTag}>
                    <Text style={suggestionStyles.activityTagText}>
                        {ACTIVITY_EMOJIS[suggestion.relatedActivity]} {ACTIVITY_DISPLAY_NAMES[suggestion.relatedActivity]}
                    </Text>
                </View>)}
        </View>);
};
const suggestionStyles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    icon: {
        fontSize: 24,
    },
    title: {
        flex: 1,
        fontSize: fontSizes.body,
        fontWeight: fontWeights.bold,
        color: colors.text,
        letterSpacing: letterSpacing.normal,
    },
    message: {
        fontSize: fontSizes.small,
        color: colors.text,
        lineHeight: 20,
        letterSpacing: letterSpacing.normal,
    },
    activityTag: {
        marginTop: spacing.sm,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.round,
    },
    activityTagText: {
        fontSize: 12,
        fontWeight: fontWeights.semiBold,
        color: colors.text,
    },
});
// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const ProgressDashboardScreen = () => {
    // ========================================================================
    // STATE
    // ========================================================================
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    // ========================================================================
    // DATA LOADING
    // ========================================================================
    const loadData = useCallback(async () => {
        try {
            const data = await SessionTracker.generateAnalysis();
            setAnalysis(data);
        }
        catch (error) {
            console.error('Failed to load analysis:', error);
        }
        finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);
    useEffect(() => {
        loadData();
    }, [loadData]);
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [loadData]);
    /**
     * Generate demo data and reload
     */
    const handleGenerateDemo = async () => {
        setIsLoading(true);
        await SessionTracker.generateDemoData();
        await loadData();
    };
    /**
     * Clear all data
     */
    const handleClearData = async () => {
        setIsLoading(true);
        await SessionTracker.clearAllData();
        await loadData();
    };
    // ========================================================================
    // RENDER HELPERS
    // ========================================================================
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        if (hours > 0)
            return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };
    const formatResponseTime = (ms) => {
        const seconds = ms / 1000;
        if (seconds < 60)
            return `${seconds.toFixed(1)}s`;
        return `${(seconds / 60).toFixed(1)}m`;
    };
    // ========================================================================
    // LOADING STATE
    // ========================================================================
    if (isLoading) {
        return (<SafeAreaView style={styles.container} edges={['bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.background}/>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingEmoji}>📊</Text>
                    <ActivityIndicator size="large" color={colors.primary}/>
                    <Text style={styles.loadingText}>Analyzing progress...</Text>
                </View>
            </SafeAreaView>);
    }
    // ========================================================================
    // EMPTY STATE
    // ========================================================================
    if (!analysis || analysis.totalAttempts === 0) {
        return (<SafeAreaView style={styles.container} edges={['bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.background}/>
                <ScrollView contentContainerStyle={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>📊</Text>
                    <Text style={styles.emptyTitle}>No Data Yet</Text>
                    <Text style={styles.emptyMessage}>
                        Start practicing with any activity to see progress data here!
                        {'\n\n'}Each attempt is tracked automatically.
                    </Text>

                    {/* Demo data button for testing */}
                    <TouchableOpacity style={styles.demoButton} onPress={handleGenerateDemo}>
                        <Text style={styles.demoButtonIcon}>🎲</Text>
                        <Text style={styles.demoButtonText}>Load Demo Data</Text>
                    </TouchableOpacity>

                    <Text style={styles.demoHint}>
                        Tap above to see what the dashboard looks like with sample data
                    </Text>
                </ScrollView>
            </SafeAreaView>);
    }
    // ========================================================================
    // MAIN RENDER
    // ========================================================================
    return (<SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background}/>

            <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>} contentContainerStyle={styles.scrollContent}>
                {/* ============================================== */}
                {/* TAB SWITCHER */}
                {/* ============================================== */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'overview' && styles.tabActive]} onPress={() => setActiveTab('overview')}>
                        <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                            📊 Overview
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'suggestions' && styles.tabActive]} onPress={() => setActiveTab('suggestions')}>
                        <Text style={[styles.tabText, activeTab === 'suggestions' && styles.tabTextActive]}>
                            💡 For Parents
                        </Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'overview' ? (<>
                        {/* ============================================== */}
                        {/* SECTION 1: OVERVIEW HEADER */}
                        {/* ============================================== */}
                        <View style={styles.overviewCard}>
                            <View style={styles.overviewHeader}>
                                <Text style={styles.overviewTitle}>Progress</Text>
                                {analysis.currentStreakDays > 0 && (<View style={styles.streakBadge}>
                                        <Text style={styles.streakIcon}>🔥</Text>
                                        <Text style={styles.streakText}>{analysis.currentStreakDays}d streak</Text>
                                    </View>)}
                            </View>

                            {/* Overall Accuracy Ring */}
                            <View style={styles.overviewBody}>
                                <AccuracyRing percentage={analysis.overallAccuracy} size={120} strokeWidth={10} color={colors.primary} label="Overall Accuracy"/>

                                {/* Quick Stats */}
                                <View style={styles.quickStats}>
                                    <View style={styles.quickStatItem}>
                                        <Text style={styles.quickStatValue}>{analysis.totalAttempts}</Text>
                                        <Text style={styles.quickStatLabel}>Total{'\n'}Attempts</Text>
                                    </View>
                                    <View style={styles.quickStatDivider}/>
                                    <View style={styles.quickStatItem}>
                                        <Text style={styles.quickStatValue}>{analysis.totalSessions}</Text>
                                        <Text style={styles.quickStatLabel}>Practice{'\n'}Sessions</Text>
                                    </View>
                                    <View style={styles.quickStatDivider}/>
                                    <View style={styles.quickStatItem}>
                                        <Text style={styles.quickStatValue}>
                                            {formatTime(analysis.totalPracticeTimeMs)}
                                        </Text>
                                        <Text style={styles.quickStatLabel}>Total{'\n'}Time</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* ============================================== */}
                        {/* SECTION 2: ACTIVITY BREAKDOWN */}
                        {/* ============================================== */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>📋 Activity Breakdown</Text>

                            <View style={styles.activityGrid}>
                                {analysis.activityStats.map((stat) => (<View key={stat.activity} style={styles.activityCard}>
                                        <View style={[
                    styles.activityHeader,
                    { backgroundColor: ACTIVITY_COLORS[stat.activity] + '40' }
                ]}>
                                            <Text style={styles.activityEmoji}>
                                                {ACTIVITY_EMOJIS[stat.activity]}
                                            </Text>
                                            <Text style={styles.activityName}>
                                                {ACTIVITY_DISPLAY_NAMES[stat.activity]}
                                            </Text>
                                        </View>

                                        <View style={styles.activityBody}>
                                            <AccuracyRing percentage={stat.accuracy} size={70} strokeWidth={7} color={ACTIVITY_COLORS[stat.activity]}/>

                                            <View style={styles.activityMeta}>
                                                <Text style={styles.activityMetaText}>
                                                    {stat.correctAttempts}/{stat.totalAttempts} correct
                                                </Text>
                                                {stat.totalAttempts > 0 && (<TrendBadge trend={stat.recentTrend}/>)}
                                                {stat.totalAttempts > 0 && (<Text style={styles.responseTimeText}>
                                                        ⏱️ avg {formatResponseTime(stat.avgResponseTimeMs)}
                                                    </Text>)}
                                            </View>
                                        </View>
                                    </View>))}
                            </View>
                        </View>

                        {/* ============================================== */}
                        {/* SECTION 3: WEEKLY PROGRESS CHART */}
                        {/* ============================================== */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>📈 Weekly Progress</Text>
                            <Text style={styles.sectionSubtitle}>Accuracy over the last 8 weeks</Text>

                            <WeeklyBarChart data={analysis.weeklyProgress.map(w => ({
                label: w.weekLabel,
                value: w.accuracy,
                count: w.totalAttempts,
            }))}/>

                            {/* Weekly attempt counts */}
                            <View style={styles.weeklyStats}>
                                {analysis.weeklyProgress.filter(w => w.totalAttempts > 0).length > 0 && (<Text style={styles.weeklyStatsText}>
                                        📝 Total attempts this period:{' '}
                                        {analysis.weeklyProgress.reduce((sum, w) => sum + w.totalAttempts, 0)}
                                    </Text>)}
                            </View>
                        </View>

                        {/* ============================================== */}
                        {/* SECTION 4: CONFUSION ANALYSIS */}
                        {/* ============================================== */}
                        {analysis.confusionMatrix.length > 0 && (<View style={styles.sectionCard}>
                                <Text style={styles.sectionTitle}>🔄 Common Mix-ups</Text>
                                <Text style={styles.sectionSubtitle}>
                                    Most frequently confused letters & numbers
                                </Text>

                                {analysis.confusionMatrix.slice(0, 8).map((item, index) => (<View key={index} style={styles.confusionRow}>
                                        <View style={styles.confusionRank}>
                                            <Text style={styles.confusionRankText}>#{index + 1}</Text>
                                        </View>
                                        <View style={styles.confusionLetters}>
                                            <View style={[styles.confusionLetter, styles.confusionExpected]}>
                                                <Text style={styles.confusionLetterText}>{item.expected}</Text>
                                            </View>
                                            <Text style={styles.confusionArrow}>→</Text>
                                            <View style={[styles.confusionLetter, styles.confusionPredicted]}>
                                                <Text style={styles.confusionLetterText}>{item.predicted}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.confusionInfo}>
                                            <Text style={styles.confusionCount}>{item.count}×</Text>
                                            <Text style={styles.confusionActivity}>
                                                {ACTIVITY_EMOJIS[item.activity]}
                                            </Text>
                                        </View>
                                        {/* Visual bar */}
                                        <View style={styles.confusionBarBg}>
                                            <View style={[
                        styles.confusionBar,
                        {
                            width: `${Math.min((item.count / (analysis.confusionMatrix[0]?.count || 1)) * 100, 100)}%`,
                            backgroundColor: DASHBOARD_COLORS.declining + '80',
                        }
                    ]}/>
                                        </View>
                                    </View>))}
                            </View>)}

                        {/* ============================================== */}
                        {/* SECTION 5: RESPONSE TIME ANALYSIS */}
                        {/* ============================================== */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>⏱️ Response Times</Text>
                            <Text style={styles.sectionSubtitle}>
                                Average time to complete each challenge
                            </Text>

                            {analysis.activityStats
                .filter(s => s.totalAttempts > 0)
                .map((stat) => {
                const maxTime = Math.max(...analysis.activityStats
                    .filter(s => s.totalAttempts > 0)
                    .map(s => s.avgResponseTimeMs), 1);
                const barWidth = (stat.avgResponseTimeMs / maxTime) * 100;
                return (<View key={stat.activity} style={styles.responseRow}>
                                            <View style={styles.responseLabel}>
                                                <Text style={styles.responseLabelEmoji}>
                                                    {ACTIVITY_EMOJIS[stat.activity]}
                                                </Text>
                                                <Text style={styles.responseLabelText}>
                                                    {ACTIVITY_DISPLAY_NAMES[stat.activity]}
                                                </Text>
                                            </View>
                                            <View style={styles.responseBarContainer}>
                                                <View style={styles.responseBarBg}>
                                                    <View style={[
                        styles.responseBar,
                        {
                            width: `${barWidth}%`,
                            backgroundColor: ACTIVITY_COLORS[stat.activity],
                        }
                    ]}/>
                                                </View>
                                                <Text style={styles.responseTime}>
                                                    {formatResponseTime(stat.avgResponseTimeMs)}
                                                </Text>
                                            </View>
                                        </View>);
            })}
                        </View>

                        {/* Data management buttons */}
                        <View style={styles.dataManagement}>
                            <TouchableOpacity style={styles.demoButtonSmall} onPress={handleGenerateDemo}>
                                <Text style={styles.demoButtonSmallText}>🎲 Reload Demo Data</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.demoButtonSmall, styles.clearButton]} onPress={handleClearData}>
                                <Text style={styles.demoButtonSmallText}>🗑️ Clear Data</Text>
                            </TouchableOpacity>
                        </View>
                    </>) : (<>
                        {/* ============================================== */}
                        {/* PARENTS TAB: SUGGESTIONS & INSIGHTS */}
                        {/* ============================================== */}
                        <View style={styles.parentHeader}>
                            <Text style={styles.parentHeaderEmoji}>👨‍👩‍👧</Text>
                            <Text style={styles.parentHeaderTitle}>
                                Insights for Parents
                            </Text>
                            <Text style={styles.parentHeaderSubtitle}>
                                Personalized suggestions based on your child's progress
                            </Text>
                        </View>

                        {/* Summary stats */}
                        <View style={styles.parentSummaryCard}>
                            <View style={styles.parentStatRow}>
                                <View style={styles.parentStatItem}>
                                    <Text style={styles.parentStatEmoji}>🎯</Text>
                                    <Text style={styles.parentStatValue}>
                                        {analysis.overallAccuracy.toFixed(0)}%
                                    </Text>
                                    <Text style={styles.parentStatLabel}>Overall Accuracy</Text>
                                </View>
                                <View style={styles.parentStatItem}>
                                    <Text style={styles.parentStatEmoji}>🏆</Text>
                                    <Text style={styles.parentStatValue}>
                                        {analysis.longestStreakDays}
                                    </Text>
                                    <Text style={styles.parentStatLabel}>Best Streak (days)</Text>
                                </View>
                                <View style={styles.parentStatItem}>
                                    <Text style={styles.parentStatEmoji}>📚</Text>
                                    <Text style={styles.parentStatValue}>
                                        {analysis.activityStats.filter(s => s.totalAttempts > 0).length}/4
                                    </Text>
                                    <Text style={styles.parentStatLabel}>Activities Used</Text>
                                </View>
                            </View>
                        </View>

                        {/* Strongest & Weakest Activity */}
                        {analysis.activityStats.filter(s => s.totalAttempts > 0).length > 0 && (<View style={styles.strengthWeaknessCard}>
                                {/* Strongest */}
                                {(() => {
                    const strongest = [...analysis.activityStats]
                        .filter(s => s.totalAttempts >= 3)
                        .sort((a, b) => b.accuracy - a.accuracy)[0];
                    if (!strongest)
                        return null;
                    return (<View style={styles.swItem}>
                                            <View style={[styles.swBadge, { backgroundColor: DASHBOARD_COLORS.improving + '30' }]}>
                                                <Text style={styles.swBadgeText}>💪 Strongest</Text>
                                            </View>
                                            <Text style={styles.swActivityName}>
                                                {ACTIVITY_EMOJIS[strongest.activity]} {ACTIVITY_DISPLAY_NAMES[strongest.activity]}
                                            </Text>
                                            <Text style={styles.swAccuracy}>
                                                {strongest.accuracy.toFixed(0)}% accuracy
                                            </Text>
                                        </View>);
                })()}

                                {/* Divider */}
                                <View style={styles.swDivider}/>

                                {/* Weakest */}
                                {(() => {
                    const weakest = [...analysis.activityStats]
                        .filter(s => s.totalAttempts >= 3)
                        .sort((a, b) => a.accuracy - b.accuracy)[0];
                    if (!weakest)
                        return null;
                    return (<View style={styles.swItem}>
                                            <View style={[styles.swBadge, { backgroundColor: DASHBOARD_COLORS.declining + '30' }]}>
                                                <Text style={styles.swBadgeText}>🎯 Focus Area</Text>
                                            </View>
                                            <Text style={styles.swActivityName}>
                                                {ACTIVITY_EMOJIS[weakest.activity]} {ACTIVITY_DISPLAY_NAMES[weakest.activity]}
                                            </Text>
                                            <Text style={styles.swAccuracy}>
                                                {weakest.accuracy.toFixed(0)}% accuracy
                                            </Text>
                                        </View>);
                })()}
                            </View>)}

                        {/* Suggestion Cards */}
                        <View style={styles.suggestionsSection}>
                            <Text style={styles.sectionTitle}>💡 Recommendations</Text>

                            {analysis.suggestions.length > 0 ? (analysis.suggestions.map((suggestion) => (<SuggestionCard key={suggestion.id} suggestion={suggestion}/>))) : (<View style={styles.noSuggestions}>
                                    <Text style={styles.noSuggestionsEmoji}>✅</Text>
                                    <Text style={styles.noSuggestionsText}>
                                        Keep practicing! Suggestions will appear as more data is collected.
                                    </Text>
                                </View>)}
                        </View>

                        {/* Research Note */}
                        <View style={styles.researchNote}>
                            <Text style={styles.researchNoteIcon}>🔬</Text>
                            <Text style={styles.researchNoteText}>
                                This analysis is part of Research Project 25-26J-333
                                focusing on dyslexia learning support. All data is stored
                                locally on the device and used solely for educational
                                progress tracking.
                            </Text>
                        </View>
                    </>)}
            </ScrollView>
        </SafeAreaView>);
};
// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    // === LAYOUT ===
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: spacing.xxl,
    },
    // === LOADING ===
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
        color: colors.primary,
        fontWeight: fontWeights.semiBold,
        letterSpacing: letterSpacing.normal,
    },
    // === EMPTY STATE ===
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    emptyEmoji: {
        fontSize: 72,
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: fontSizes.xlarge,
        fontWeight: fontWeights.bold,
        color: colors.text,
        marginBottom: spacing.md,
        letterSpacing: letterSpacing.normal,
    },
    emptyMessage: {
        fontSize: fontSizes.body,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 26,
        letterSpacing: letterSpacing.normal,
    },
    // === DEMO BUTTON ===
    demoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        marginTop: spacing.xl,
        gap: spacing.sm,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    demoButtonIcon: {
        fontSize: 24,
    },
    demoButtonText: {
        fontSize: fontSizes.large,
        fontWeight: fontWeights.bold,
        color: colors.textOnPrimary,
        letterSpacing: letterSpacing.normal,
    },
    demoHint: {
        marginTop: spacing.md,
        fontSize: fontSizes.small,
        color: colors.textLight,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    // === TAB SWITCHER ===
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.md,
        backgroundColor: colors.greyLight,
        borderRadius: borderRadius.xl,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm + 2,
        alignItems: 'center',
        borderRadius: borderRadius.lg,
    },
    tabActive: {
        backgroundColor: DASHBOARD_COLORS.cardBg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        fontSize: fontSizes.body,
        fontWeight: fontWeights.semiBold,
        color: colors.textLight,
        letterSpacing: letterSpacing.normal,
    },
    tabTextActive: {
        color: colors.text,
    },
    // === OVERVIEW CARD ===
    overviewCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: DASHBOARD_COLORS.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    overviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    overviewTitle: {
        fontSize: fontSizes.xlarge,
        fontWeight: fontWeights.extraBold,
        color: colors.text,
        letterSpacing: letterSpacing.normal,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF0E0',
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs + 2,
        borderRadius: borderRadius.round,
        gap: 4,
    },
    streakIcon: {
        fontSize: 16,
    },
    streakText: {
        fontSize: fontSizes.small,
        fontWeight: fontWeights.bold,
        color: '#D97706',
    },
    overviewBody: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    quickStats: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.md,
        marginLeft: spacing.md,
    },
    quickStatItem: {
        alignItems: 'center',
    },
    quickStatValue: {
        fontSize: fontSizes.xlarge,
        fontWeight: fontWeights.extraBold,
        color: colors.text,
    },
    quickStatLabel: {
        fontSize: 12,
        color: colors.textLight,
        textAlign: 'center',
        marginTop: 2,
    },
    quickStatDivider: {
        width: 40,
        height: 1,
        backgroundColor: colors.greyLight,
    },
    // === SECTION CARD ===
    sectionCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: DASHBOARD_COLORS.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: fontSizes.large,
        fontWeight: fontWeights.bold,
        color: colors.text,
        marginBottom: spacing.xs,
        letterSpacing: letterSpacing.normal,
    },
    sectionSubtitle: {
        fontSize: fontSizes.small,
        color: colors.textLight,
        marginBottom: spacing.md,
        letterSpacing: letterSpacing.normal,
    },
    // === ACTIVITY GRID ===
    activityGrid: {
        gap: spacing.md,
    },
    activityCard: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.greyLight,
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    activityEmoji: {
        fontSize: 20,
    },
    activityName: {
        fontSize: fontSizes.body,
        fontWeight: fontWeights.bold,
        color: colors.text,
        letterSpacing: letterSpacing.normal,
    },
    activityBody: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    activityMeta: {
        flex: 1,
        gap: spacing.xs,
    },
    activityMetaText: {
        fontSize: fontSizes.small,
        color: colors.text,
        fontWeight: fontWeights.regular,
    },
    responseTimeText: {
        fontSize: 12,
        color: colors.textLight,
    },
    // === WEEKLY STATS ===
    weeklyStats: {
        marginTop: spacing.sm,
        alignItems: 'center',
    },
    weeklyStatsText: {
        fontSize: fontSizes.small,
        color: colors.textLight,
    },
    // === CONFUSION ANALYSIS ===
    confusionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.greyLight,
    },
    confusionRank: {
        width: 28,
        alignItems: 'center',
    },
    confusionRankText: {
        fontSize: 12,
        fontWeight: fontWeights.bold,
        color: colors.textLight,
    },
    confusionLetters: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginRight: spacing.sm,
    },
    confusionLetter: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confusionExpected: {
        backgroundColor: colors.greenLight,
    },
    confusionPredicted: {
        backgroundColor: colors.redLight,
    },
    confusionLetterText: {
        fontSize: fontSizes.body,
        fontWeight: fontWeights.extraBold,
        color: colors.text,
    },
    confusionArrow: {
        fontSize: 14,
        color: colors.textLight,
    },
    confusionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginRight: spacing.sm,
        minWidth: 44,
    },
    confusionCount: {
        fontSize: fontSizes.small,
        fontWeight: fontWeights.bold,
        color: colors.text,
    },
    confusionActivity: {
        fontSize: 14,
    },
    confusionBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: colors.greyLight,
        borderRadius: 3,
    },
    confusionBar: {
        height: 6,
        borderRadius: 3,
    },
    // === RESPONSE TIME ===
    responseRow: {
        marginBottom: spacing.md,
    },
    responseLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    responseLabelEmoji: {
        fontSize: 16,
    },
    responseLabelText: {
        fontSize: fontSizes.small,
        fontWeight: fontWeights.semiBold,
        color: colors.text,
    },
    responseBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    responseBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: colors.greyLight,
        borderRadius: 5,
        overflow: 'hidden',
    },
    responseBar: {
        height: 10,
        borderRadius: 5,
    },
    responseTime: {
        fontSize: fontSizes.small,
        fontWeight: fontWeights.bold,
        color: colors.text,
        minWidth: 40,
    },
    // === DATA MANAGEMENT ===
    dataManagement: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.md,
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    demoButtonSmall: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.greyLight,
    },
    clearButton: {
        backgroundColor: colors.redLight,
    },
    demoButtonSmallText: {
        fontSize: fontSizes.small,
        fontWeight: fontWeights.semiBold,
        color: colors.text,
    },
    // === PARENT TAB ===
    parentHeader: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    parentHeaderEmoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    parentHeaderTitle: {
        fontSize: fontSizes.xlarge,
        fontWeight: fontWeights.extraBold,
        color: colors.text,
        textAlign: 'center',
        letterSpacing: letterSpacing.normal,
    },
    parentHeaderSubtitle: {
        fontSize: fontSizes.body,
        color: colors.textLight,
        textAlign: 'center',
        marginTop: spacing.xs,
        letterSpacing: letterSpacing.normal,
    },
    // === PARENT SUMMARY ===
    parentSummaryCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: DASHBOARD_COLORS.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    parentStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    parentStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    parentStatEmoji: {
        fontSize: 28,
        marginBottom: spacing.xs,
    },
    parentStatValue: {
        fontSize: fontSizes.xlarge,
        fontWeight: fontWeights.extraBold,
        color: colors.text,
    },
    parentStatLabel: {
        fontSize: 12,
        color: colors.textLight,
        textAlign: 'center',
        marginTop: 2,
    },
    // === STRENGTH/WEAKNESS ===
    strengthWeaknessCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: DASHBOARD_COLORS.cardBg,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    swItem: {
        flex: 1,
        alignItems: 'center',
    },
    swBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.round,
        marginBottom: spacing.sm,
    },
    swBadgeText: {
        fontSize: 12,
        fontWeight: fontWeights.bold,
        color: colors.text,
    },
    swActivityName: {
        fontSize: fontSizes.body,
        fontWeight: fontWeights.bold,
        color: colors.text,
        textAlign: 'center',
    },
    swAccuracy: {
        fontSize: fontSizes.small,
        color: colors.textLight,
        marginTop: 2,
    },
    swDivider: {
        width: 1,
        backgroundColor: colors.greyLight,
        marginHorizontal: spacing.md,
    },
    // === SUGGESTIONS ===
    suggestionsSection: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    noSuggestions: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    noSuggestionsEmoji: {
        fontSize: 48,
        marginBottom: spacing.sm,
    },
    noSuggestionsText: {
        fontSize: fontSizes.body,
        color: colors.textLight,
        textAlign: 'center',
    },
    // === RESEARCH NOTE ===
    researchNote: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.blueGreyLight,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    researchNoteIcon: {
        fontSize: 20,
    },
    researchNoteText: {
        flex: 1,
        fontSize: 12,
        color: colors.textLight,
        lineHeight: 18,
    },
});
