import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Circle, Polygon } from 'react-native-svg';
import { colors, fonts } from '../../../theme';
import { scale, moderateScale } from '../../../utils/responsive';
import BackButton from '../../../components/BackButton';
import BackendStatusDot from '../../../components/ui/BackendStatusDot';

const ACTION_ITEMS = [
  {
    id: 'memoryAssessment',
    title: 'Memory Test',
    subtitle: 'Remember and perform actions',
    emoji: '🧠',
    route: 'MemoryAssessment',
    gradientColors: ['#B987DC', '#96ADFC'],
  },
  {
    id: 'instructionFollow',
    title: 'Follow Instructions',
    subtitle: 'Listen and respond carefully',
    emoji: '🎯',
    route: 'InstructionFollow',
    gradientColors: ['#A8F29A', '#EDDD6D'],
  },
  {
    id: 'actionsProgress',
    title: 'Progress Dashboard',
    subtitle: 'Track scores, trends, and recent attempts',
    emoji: '📊',
    route: 'ActionsProgress',
    gradientColors: ['#F3E8FF', '#FCE7F3'],
  },
];

const TinyOwl = ({ size = 48 }) => (
  <Svg viewBox="0 0 100 100" width={size} height={size}>
    <Ellipse cx="50" cy="65" rx="30" ry="32" fill={colors.purple} />
    <Ellipse cx="22" cy="68" rx="14" ry="22" fill={colors.blue} />
    <Ellipse cx="78" cy="68" rx="14" ry="22" fill={colors.blue} />
    <Ellipse cx="50" cy="72" rx="18" ry="20" fill="#EDE9FE" opacity="0.8" />
    <Circle cx="50" cy="38" r="28" fill={colors.purple} />
    <Polygon points="35,12 30,2 40,10" fill={colors.blue} />
    <Polygon points="65,12 70,2 60,10" fill={colors.blue} />
    <Circle cx="39" cy="36" r="13" fill="white" />
    <Circle cx="61" cy="36" r="13" fill="white" />
    <Circle cx="39" cy="36" r="9" fill={colors.green} />
    <Circle cx="61" cy="36" r="9" fill={colors.green} />
    <Circle cx="40" cy="36" r="5" fill="#2C3E50" />
    <Circle cx="62" cy="36" r="5" fill="#2C3E50" />
    <Circle cx="38" cy="33" r="2" fill="white" />
    <Circle cx="60" cy="33" r="2" fill="white" />
    <Polygon points="50,42 45,50 55,50" fill={colors.orange} />
  </Svg>
);

const ActionsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const owlBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(owlBounce, { toValue: -6, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(owlBounce, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(2500),
        ])
      ).start();
    }, []);

  return (
    <LinearGradient
      colors={['#F8FAFC', '#EDE9FE', '#DBE1F1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <BackButton onPress={() => navigation.navigate('MainHome')} />
          <Text style={styles.topTitle}>Actions</Text>
          <View style={styles.topSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: scale(24) + insets.bottom + 70 }]}
        >
          <View style={styles.headerCard}>
            <Animated.View style={{ transform: [{ translateY: owlBounce }] }}>
              <TinyOwl size={64} />
            </Animated.View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Actions! 🎯</Text>
              <Text style={styles.headerSubtitle}>Pick an action challenge to play</Text>
            </View>
            <BackendStatusDot backendKey="actions" />
          </View>

          <View style={styles.list}>
            {ACTION_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                style={styles.cardOuter}
                onPress={() => navigation.navigate(item.route)}
              >
                <LinearGradient
                  colors={item.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.card}
                >
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: scale(12),
    marginTop: scale(8),
    borderRadius: scale(22),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: moderateScale(18),
    color: colors.textPrimary,
  },
  topSpacer: {
    width: scale(40),
    height: scale(40),
  },
  scroll: {
    paddingHorizontal: scale(12),
    paddingTop: scale(16),
  },
  butterflyWrap: {
    marginRight: scale(12),
  },
  butterfly: {
    fontSize: moderateScale(34),
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: scale(22),
    padding: scale(16),
    marginBottom: scale(16),
    shadowColor: '#B987DC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: scale(12),
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(20),
    color: '#2D0C57',
  },
  headerSubtitle: {
    marginTop: scale(4),
    fontFamily: fonts.regular,
    fontSize: moderateScale(12),
    color: '#7C3AED',
  },
  list: {
    gap: scale(12),
  },
  cardOuter: {
    borderRadius: scale(20),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  card: {
    padding: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: moderateScale(28),
    marginRight: scale(12),
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(16),
    color: '#1F2937',
  },
  cardSubtitle: {
    marginTop: scale(2),
    fontFamily: fonts.regular,
    fontSize: moderateScale(12),
    color: '#374151',
  },
});

export default ActionsScreen;
