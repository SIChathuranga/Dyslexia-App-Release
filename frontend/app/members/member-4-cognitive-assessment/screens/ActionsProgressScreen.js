import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, Brain, Goal, History, TrendingUp } from 'lucide-react-native';
import BackButton from '../../../components/BackButton';
import { colors, fonts } from '../../../theme';
import { loadAssessments } from '../utils/assessmentHelper';

const TYPE_LABELS = {
  MEMORY_ASSESSMENT: 'Memory Test',
  INSTRUCTION_ASSESSMENT: 'Follow Instructions',
};

const MAX_TREND_POINTS = 7;

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const toAccuracy = (entry) => {
  const probability = Number(entry?.probability ?? 0);
  const bounded = Math.max(0, Math.min(1, probability));
  return Math.round(bounded * 100);
};

const getGuidance = (overview) => {
  if (overview.totalAttempts === 0) {
    return 'No attempts yet. Complete Memory Test and Follow Instructions to build your progress profile.';
  }

  if (overview.avgAccuracy >= 85) {
    return 'Excellent consistency. Keep challenge difficulty increasing and maintain this routine.';
  }

  if (overview.avgAccuracy >= 65) {
    return 'Good progress. Focus on smoother actions and faster response to improve overall accuracy.';
  }

  return 'Needs support. Practice both activities in short daily sessions and review attempt feedback after each run.';
};

const MetricCard = ({ icon: Icon, title, value, subtitle, tint }) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: tint }]}>
      <Icon size={18} color="#1F2937" />
    </View>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricSub}>{subtitle}</Text>
  </View>
);

const ActionsProgressScreen = ({ navigation }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const all = await loadAssessments();
      const filtered = all.filter(
        (item) => item?.type === 'MEMORY_ASSESSMENT' || item?.type === 'INSTRUCTION_ASSESSMENT'
      );
      setRecords(filtered);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    if (!records.length) {
      return {
        totalAttempts: 0,
        avgAccuracy: 0,
        bestAccuracy: 0,
        lastAttempt: null,
        breakdown: [],
        trend: [],
      };
    }

    const accuracies = records.map(toAccuracy);
    const avgAccuracy = Math.round(accuracies.reduce((sum, v) => sum + v, 0) / accuracies.length);
    const bestAccuracy = Math.max(...accuracies);

    const breakdown = ['MEMORY_ASSESSMENT', 'INSTRUCTION_ASSESSMENT'].map((type) => {
      const typeItems = records.filter((item) => item.type === type);
      const values = typeItems.map(toAccuracy);
      const avg = values.length
        ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
        : 0;

      return {
        type,
        count: typeItems.length,
        avg,
        latest: typeItems[0] ? toAccuracy(typeItems[0]) : 0,
      };
    });

    const sortedByTime = [...records].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const trend = sortedByTime.slice(-MAX_TREND_POINTS).map((item, index) => ({
      id: `${item.id}_${index}`,
      label: `${index + 1}`,
      value: toAccuracy(item),
      type: item.type,
    }));

    return {
      totalAttempts: records.length,
      avgAccuracy,
      bestAccuracy,
      lastAttempt: records[0]?.timestamp || null,
      breakdown,
      trend,
    };
  }, [records]);

  const guidance = useMemo(() => getGuidance(stats), [stats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  return (
    <LinearGradient
      colors={['#F8FAFC', '#EDE9FE', '#FCE7F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Actions Progress</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.purple} />
            <Text style={styles.loaderText}>Loading progress data...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <Text style={styles.pageTitle}>Comprehensive Dashboard</Text>
            <Text style={styles.pageSub}>Performance insights for Memory Test and Follow Instructions</Text>

            <View style={styles.metricsGrid}>
              <MetricCard
                icon={Brain}
                title="Total Attempts"
                value={`${stats.totalAttempts}`}
                subtitle="All saved action assessments"
                tint="#EDE9FE"
              />
              <MetricCard
                icon={BarChart3}
                title="Average Accuracy"
                value={`${stats.avgAccuracy}%`}
                subtitle="Across all attempts"
                tint="#DBEAFE"
              />
              <MetricCard
                icon={TrendingUp}
                title="Best Score"
                value={`${stats.bestAccuracy}%`}
                subtitle="Highest recorded accuracy"
                tint="#DCFCE7"
              />
              <MetricCard
                icon={History}
                title="Last Attempt"
                value={stats.lastAttempt ? 'Recorded' : 'No data'}
                subtitle={formatDate(stats.lastAttempt)}
                tint="#FEF3C7"
              />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Assessment Breakdown</Text>
              {stats.breakdown.map((item) => (
                <View key={item.type} style={styles.breakdownRow}>
                  <View>
                    <Text style={styles.breakdownLabel}>{TYPE_LABELS[item.type]}</Text>
                    <Text style={styles.breakdownMeta}>{item.count} attempts</Text>
                  </View>
                  <View style={styles.breakdownRight}>
                    <Text style={styles.breakdownValue}>{item.avg}% avg</Text>
                    <Text style={styles.breakdownMeta}>Latest: {item.latest}%</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Recent Trend (Last {MAX_TREND_POINTS})</Text>
              {stats.trend.length === 0 ? (
                <Text style={styles.emptyText}>No trend data yet. Complete an assessment to start tracking.</Text>
              ) : (
                <View style={styles.trendRow}>
                  {stats.trend.map((point) => (
                    <View key={point.id} style={styles.trendItem}>
                      <View style={styles.trendTrack}>
                        <View style={[styles.trendBar, { height: Math.max(8, Math.round((point.value / 100) * 120)) }]} />
                      </View>
                      <Text style={styles.trendValue}>{point.value}%</Text>
                      <Text style={styles.trendLabel}>{point.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Recent Attempts</Text>
              {records.length === 0 ? (
                <Text style={styles.emptyText}>No saved attempts found for Actions.</Text>
              ) : (
                records.slice(0, 8).map((entry) => (
                  <View key={entry.id} style={styles.attemptRow}>
                    <View style={styles.attemptMain}>
                      <Text style={styles.attemptType}>{TYPE_LABELS[entry.type] || entry.type}</Text>
                      <Text style={styles.attemptSummary} numberOfLines={2}>
                        {entry.summary || 'Completed assessment'}
                      </Text>
                    </View>
                    <View style={styles.attemptRight}>
                      <Text style={styles.attemptScore}>{toAccuracy(entry)}%</Text>
                      <Text style={styles.attemptDate}>{formatDate(entry.timestamp)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.guidanceCard}>
              <View style={styles.guidanceHeader}>
                <Goal size={18} color="#1F2937" />
                <Text style={styles.guidanceTitle}>Coach Guidance</Text>
              </View>
              <Text style={styles.guidanceText}>{guidance}</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.startButton}
                onPress={() => navigation.navigate('Actions')}
              >
                <Text style={styles.startButtonText}>Start Actions Practice</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: '#2D0C57',
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontFamily: fonts.regular,
    color: '#6B7280',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#1F2937',
    marginTop: 4,
  },
  pageSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  metricValue: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#1F2937',
  },
  metricSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#9CA3AF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  breakdownLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#1F2937',
  },
  breakdownMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#7C3AED',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 160,
    marginTop: 8,
  },
  trendItem: {
    alignItems: 'center',
    width: '13%',
  },
  trendTrack: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  trendBar: {
    width: 16,
    borderRadius: 8,
    backgroundColor: '#96ADFC',
  },
  trendValue: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#4B5563',
  },
  trendLabel: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: '#9CA3AF',
  },
  attemptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 10,
  },
  attemptMain: {
    flex: 1,
    marginRight: 8,
  },
  attemptType: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#1F2937',
  },
  attemptSummary: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  attemptRight: {
    alignItems: 'flex-end',
    maxWidth: 110,
  },
  attemptScore: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#7C3AED',
  },
  attemptDate: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  guidanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guidanceTitle: {
    marginLeft: 8,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#1F2937',
  },
  guidanceText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
  startButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  startButtonText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#6B7280',
  },
});

export default ActionsProgressScreen;
