import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { getProgress } from '../../services/multiSkillApi';

export default function MultiSkillProgressScreen({ route }) {
    const { userId } = route.params || { userId: 'default_user' };
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const data = await getProgress(userId);
                setProgress(data);
            } catch (err) {
                setError("Failed to load progress. Make sure the backend is running.");
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, [userId]);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6200EE" />
                <Text style={styles.loadingText}>Fetching Diagnosis...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!progress || progress.error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{progress?.error || "No data available."}</Text>
            </View>
        );
    }

    const { 
        current_stage_label, 
        latest_prediction, 
        recommendation, 
        total_sessions,
        initial_stage_label,
        trend,
        overall_improving
    } = progress;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.headerTitle}>Diagnosis Report</Text>
                
                <View style={[styles.card, { borderLeftColor: current_stage_label === 'No Dyslexia' ? '#2ecc71' : '#e74c3c' }]}>
                    <Text style={styles.cardHeader}>Current Stage</Text>
                    <Text style={[styles.resultText, { color: latest_prediction?.stage_color || '#333' }]}>
                        {current_stage_label}
                    </Text>
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardHeader}>Progress Trend</Text>
                    <Text style={styles.infoText}>
                        Total Sessions: <Text style={styles.bold}>{total_sessions}</Text>
                    </Text>
                    <Text style={styles.infoText}>
                        Initial Stage: <Text style={styles.bold}>{initial_stage_label}</Text>
                    </Text>
                    <Text style={styles.infoText}>
                        Trend: <Text style={[styles.bold, { color: overall_improving ? '#2ecc71' : (trend === 'stable' ? '#f39c12' : '#e74c3c') }]}>
                            {trend ? trend.toUpperCase() : 'UNKNOWN'}
                        </Text>
                    </Text>
                </View>
                
                {latest_prediction && latest_prediction.probabilities && (
                    <View style={styles.card}>
                        <Text style={styles.cardHeader}>Latest Prediction Scores</Text>
                        {Object.entries(latest_prediction.probabilities).map(([label, prob]) => (
                            <View key={label} style={styles.probRow}>
                                <Text style={styles.probLabel}>{label}</Text>
                                <Text style={styles.probValue}>{(prob * 100).toFixed(1)}%</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.footer}>
                    <View style={styles.footerInner}>
                        <Text style={styles.footerEmoji}>⭐</Text>
                        <Text style={styles.footerTitle}>You're doing great!</Text>
                        <Text style={styles.footerSub}>Keep practicing every day</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
    errorText: { fontSize: 16, color: '#e74c3c', textAlign: 'center', margin: 20 },
    scrollContent: { padding: 20 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
    card: {
        backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
        borderLeftWidth: 5, borderLeftColor: '#6200EE'
    },
    cardHeader: { fontSize: 18, fontWeight: 'bold', color: '#555', marginBottom: 10 },
    resultText: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    recommendationText: { fontSize: 16, color: '#666', lineHeight: 22 },
    infoText: { fontSize: 16, color: '#444', marginBottom: 5 },
    bold: { fontWeight: 'bold' },
    probRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    probLabel: { fontSize: 16, color: '#555' },
    probValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    footer: {
        marginTop: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    footerInner: {
        backgroundColor: '#FEF3C7',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    footerEmoji: {
        fontSize: 32,
        marginBottom: 4,
    },
    footerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    footerSub: {
        fontSize: 12,
        color: '#4B5563',
        marginTop: 2,
    },
});
