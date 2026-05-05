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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, TrendingUp, Filter } from 'lucide-react-native';
import BackButton from '../../../components/BackButton';
import { colors, fonts } from '../../../theme';
import { scale, moderateScale } from '../../../utils/responsive';
import { getAuthSession, isSessionValid } from '../../../services/authSession';
import { fetchAssessmentHistoryRemote, setAuthToken } from '../../../services/api';

const TYPE_LABELS = {
  MEMORY_ASSESSMENT: 'Memory Test',
  INSTRUCTION_ASSESSMENT: 'Follow Instructions',
};

const STATUS_COLORS = {
  MEMORY_ASSESSMENT: '#B987DC',
  INSTRUCTION_ASSESSMENT: '#96ADFC',
};

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const formatDateShort = (iso) => {
  if (!iso) return 'N/A';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

const getSessionUserId = (session) => {
  const rawId =
    session?.user?.id ??
    session?.user?.user_id ??
    session?.user_id ??
    session?.id;
  const n = Number(rawId);
  return Number.isFinite(n) ? n : null;
};

const AssessmentHistoryScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState(null); // null for all
  const [currentPage, setCurrentPage] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      console.log('[AssessmentHistoryScreen] fetchData: Starting...');
      const session = await getAuthSession();
      console.log('[AssessmentHistoryScreen] fetchData: Session retrieved:', { 
        hasSession: !!session,
        sessionKeys: session ? Object.keys(session) : [],
        userId: session?.user?.id ?? session?.user_id ?? session?.id,
      });

      if (!isSessionValid(session)) {
        console.warn('[AssessmentHistoryScreen] fetchData: Session not valid');
        setRecords([]);
        return;
      }

      const userId = getSessionUserId(session);
      console.log('[AssessmentHistoryScreen] fetchData: Extracted userId:', userId);
      
      if (!userId) {
        console.warn('[AssessmentHistoryScreen] fetchData: No valid userId');
        setRecords([]);
        return;
      }

      console.log('[AssessmentHistoryScreen] fetchData: Setting auth token and calling API...');
      setAuthToken(session.token);
      
      const response = await fetchAssessmentHistoryRemote({
        user_id: userId,
        page: 0,
        size: 100,
      });

      console.log('[AssessmentHistoryScreen] fetchData: API Response received:', {
        status: response?.status,
        assessmentsCount: response?.assessments?.length || 0,
      });

      const assessments = Array.isArray(response?.assessments) ? response.assessments : [];
      setRecords(
        assessments.map((item) => ({
          id: `${item.id || item.assessment_date || Date.now()}`,
          type: item.assessment_type || 'ASSESSMENT',
          accuracy: Number(item.accuracy || 0),
          completionRate: Number(item.completion_rate || 0),
          responseTime: Number(item.response_time || 0),
          satisfactionScore: Number(item.satisfaction_score || 0),
          date: item.assessment_date || new Date().toISOString(),
          notes: item.notes || '',
        }))
      );
    } catch (error) {
      console.error('[AssessmentHistoryScreen] fetchData: Error occurred:', {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        fullError: error,
      });
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRecords = useMemo(() => {
    if (!selectedType) return records;
    return records.filter((item) => item.type === selectedType);
  }, [records, selectedType]);

  const stats = useMemo(() => {
    if (!filteredRecords.length) {
      return {
        totalAttempts: 0,
        avgAccuracy: 0,
        bestAccuracy: 0,
        worstAccuracy: 100,
        avgCompletionRate: 0,
      };
    }

    const accuracies = filteredRecords.map((r) => r.accuracy);
    const completionRates = filteredRecords.map((r) => r.completionRate);

    return {
      totalAttempts: filteredRecords.length,
      avgAccuracy: Math.round(accuracies.reduce((sum, v) => sum + v, 0) / accuracies.length),
      bestAccuracy: Math.max(...accuracies),
      worstAccuracy: Math.min(...accuracies),
      avgCompletionRate: Math.round(completionRates.reduce((sum, v) => sum + v, 0) / completionRates.length),
    };
  }, [filteredRecords]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const assessmentTypes = [
    { key: null, label: 'All', count: records.length },
    { key: 'MEMORY_ASSESSMENT', label: 'Memory', count: records.filter((r) => r.type === 'MEMORY_ASSESSMENT').length },
    { key: 'INSTRUCTION_ASSESSMENT', label: 'Instructions', count: records.filter((r) => r.type === 'INSTRUCTION_ASSESSMENT').length },
  ];

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
          <Text style={styles.headerTitle}>Assessment History</Text>
          <View style={{ width: scale(40) }} />
        </View>

        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.purple} />
            <Text style={styles.loaderText}>Loading assessment history...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, { paddingBottom: scale(24) + insets.bottom + 70 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <Text style={styles.pageTitle}>Assessment History 📋</Text>
            <Text style={styles.pageSub}>Review your past assessment performance</Text>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
              {assessmentTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  activeOpacity={0.7}
                  style={[
                    styles.filterTab,
                    selectedType === type.key && styles.filterTabActive,
                  ]}
                  onPress={() => setSelectedType(type.key)}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selectedType === type.key && styles.filterTabTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                  <Text
                    style={[
                      styles.filterTabCount,
                      selectedType === type.key && styles.filterTabCountActive,
                    ]}
                  >
                    {type.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Statistics */}
            {filteredRecords.length > 0 && (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <Filter size={18} color="#1F2937" />
                  </View>
                  <Text style={styles.statLabel}>Attempts</Text>
                  <Text style={styles.statValue}>{stats.totalAttempts}</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <TrendingUp size={18} color="#1F2937" />
                  </View>
                  <Text style={styles.statLabel}>Avg Accuracy</Text>
                  <Text style={styles.statValue}>{stats.avgAccuracy}%</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <TrendingUp size={18} color="#1F2937" />
                  </View>
                  <Text style={styles.statLabel}>Best Score</Text>
                  <Text style={styles.statValue}>{stats.bestAccuracy}%</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <TrendingUp size={18} color="#1F2937" />
                  </View>
                  <Text style={styles.statLabel}>Completion</Text>
                  <Text style={styles.statValue}>{stats.avgCompletionRate}%</Text>
                </View>
              </View>
            )}

            {/* History List */}
            <View style={styles.historySection}>
              <View style={styles.sectionHeader}>
                <Calendar size={18} color="#2D0C57" />
                <Text style={styles.sectionTitle}>Assessment Details</Text>
              </View>

              {filteredRecords.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>📊</Text>
                  <Text style={styles.emptyText}>
                    {selectedType
                      ? `No ${TYPE_LABELS[selectedType]} assessments yet.`
                      : 'No assessments recorded yet.'}
                  </Text>
                  <Text style={styles.emptySubtext}>Complete an assessment to see history.</Text>
                </View>
              ) : (
                filteredRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 50)
                  .map((entry) => (
                    <View key={entry.id} style={styles.historyItem}>
                      <View style={[styles.typeIndicator, { backgroundColor: STATUS_COLORS[entry.type] }]} />
                      <View style={styles.historyContent}>
                        <View style={styles.historyHeader}>
                          <Text style={styles.assessmentType}>{TYPE_LABELS[entry.type] || entry.type}</Text>
                          <Text style={[styles.accuracy, { color: entry.accuracy >= 70 ? '#22c55e' : '#ef4444' }]}>
                            {entry.accuracy.toFixed(1)}%
                          </Text>
                        </View>
                        <View style={styles.historyMeta}>
                          <View style={styles.metaItem}>
                            <Clock size={12} color="#7c3aed" />
                            <Text style={styles.metaText}>{formatDate(entry.date)}</Text>
                          </View>
                        </View>
                        <View style={styles.metricsRow}>
                          <View style={styles.metricSmall}>
                            <Text style={styles.metricSmallLabel}>Completion</Text>
                            <Text style={styles.metricSmallValue}>{entry.completionRate.toFixed(1)}%</Text>
                          </View>
                          <View style={styles.metricSmall}>
                            <Text style={styles.metricSmallLabel}>Response Time</Text>
                            <Text style={styles.metricSmallValue}>{entry.responseTime.toFixed(1)}s</Text>
                          </View>
                          <View style={styles.metricSmall}>
                            <Text style={styles.metricSmallLabel}>Satisfaction</Text>
                            <Text style={styles.metricSmallValue}>⭐ {entry.satisfactionScore}</Text>
                          </View>
                        </View>
                        {entry.notes && (
                          <Text style={styles.notes}>{entry.notes}</Text>
                        )}
                      </View>
                    </View>
                  ))
              )}
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
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(22),
    color: '#2D0C57',
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: scale(12),
    fontSize: moderateScale(14),
    color: '#7c3aed',
    fontFamily: fonts.regular,
  },
  scroll: {
    paddingHorizontal: scale(12),
    paddingTop: scale(8),
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(24),
    color: '#2D0C57',
    marginHorizontal: scale(4),
    marginBottom: scale(4),
  },
  pageSub: {
    fontFamily: fonts.regular,
    fontSize: moderateScale(12),
    color: '#7c3aed',
    marginHorizontal: scale(4),
    marginBottom: scale(16),
  },
  filterTabs: {
    flexDirection: 'row',
    gap: scale(8),
    marginBottom: scale(16),
    paddingHorizontal: scale(4),
  },
  filterTab: {
    flex: 1,
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  filterTabText: {
    fontFamily: fonts.semibold,
    fontSize: moderateScale(12),
    color: '#7c3aed',
  },
  filterTabTextActive: {
    color: 'white',
  },
  filterTabCount: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(16),
    color: '#7c3aed',
    marginTop: scale(2),
  },
  filterTabCountActive: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: scale(8),
    marginBottom: scale(16),
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: scale(12),
    padding: scale(12),
    alignItems: 'center',
  },
  statIcon: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(6),
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: moderateScale(10),
    color: '#7c3aed',
    marginBottom: scale(2),
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(16),
    color: '#2D0C57',
  },
  historySection: {
    marginBottom: scale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(12),
    paddingHorizontal: scale(4),
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(16),
    color: '#2D0C57',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: scale(12),
    padding: scale(24),
    alignItems: 'center',
    marginBottom: scale(12),
  },
  emptyIcon: {
    fontSize: moderateScale(40),
    marginBottom: scale(12),
  },
  emptyText: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(14),
    color: '#2D0C57',
    marginBottom: scale(4),
  },
  emptySubtext: {
    fontFamily: fonts.regular,
    fontSize: moderateScale(12),
    color: '#7c3aed',
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: scale(12),
    marginBottom: scale(8),
    overflow: 'hidden',
  },
  typeIndicator: {
    width: scale(4),
  },
  historyContent: {
    flex: 1,
    padding: scale(12),
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  assessmentType: {
    fontFamily: fonts.semibold,
    fontSize: moderateScale(13),
    color: '#2D0C57',
  },
  accuracy: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(13),
  },
  historyMeta: {
    marginBottom: scale(6),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  metaText: {
    fontFamily: fonts.regular,
    fontSize: moderateScale(11),
    color: '#7c3aed',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: scale(8),
    marginTop: scale(6),
  },
  metricSmall: {
    flex: 1,
    backgroundColor: '#EDE9FE',
    borderRadius: scale(8),
    padding: scale(6),
    alignItems: 'center',
  },
  metricSmallLabel: {
    fontFamily: fonts.regular,
    fontSize: moderateScale(9),
    color: '#7c3aed',
  },
  metricSmallValue: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(11),
    color: '#2D0C57',
    marginTop: scale(2),
  },
  notes: {
    fontFamily: fonts.regular,
    fontSize: moderateScale(10),
    color: '#7c3aed',
    marginTop: scale(6),
    fontStyle: 'italic',
  },
});

export default AssessmentHistoryScreen;
