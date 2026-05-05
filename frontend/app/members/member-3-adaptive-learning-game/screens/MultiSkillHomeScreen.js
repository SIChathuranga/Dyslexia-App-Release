/**
 * MultiSkillHomeScreen
 * Kids-friendly home screen for the Multi-Skill Learning Game module.
 * Uses dyslexia-friendly colors, OpenDyslexic font, and animated game cards.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Circle, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { predictSession } from '../services/multiSkillApi';
import BackendStatusDot from '../../../components/ui/BackendStatusDot';
import { colors, fonts } from '../../../theme';
import BackButton from '../../../components/BackButton';

// ── Small inline owl icon ─────────────────────────────────────────────────────
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

// ── Animated game card ────────────────────────────────────────────────────────
const GameCard = ({ title, description, emoji, gradientColors, onPress, delay = 0 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 450,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 450,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }], marginBottom: 12 }}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardEmoji}>
            <Text style={styles.cardEmojiText}>{emoji}</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDesc}>{description}</Text>
          </View>
          <Text style={styles.cardArrow}>▶</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const GAMES = [
  {
    title: 'Phoneme Pop',
    description: 'Listen and find the matching letter!',
    emoji: '🔤',
    gradientColors: ['#DBE1F1', '#B987DC'],
    route: 'PhonemePop',
  },
  {
    title: 'Visual Sequence',
    description: 'Remember the order of shapes!',
    emoji: '🎨',
    gradientColors: ['#EDE9FE', '#96ADFC'],
    route: 'VisualSequence',
  },
  {
    title: 'Sound & Picture',
    description: 'Match the sound to the picture!',
    emoji: '🔊',
    gradientColors: ['#EDD1B0', '#EDDD6D'],
    route: 'SoundMatch',
  },
  {
    title: 'Word Builder',
    description: 'Unscramble the letters to spell!',
    emoji: '🔡',
    gradientColors: ['#A8F29A', '#A5F7E1'],
    route: 'WordBuilder',
  },  {
    title: 'Progress',
    description: 'See your learning report',
    emoji: '📊',
    gradientColors: ['#F3E8FF', '#FCE7F3'],
    route: 'MultiSkillProgress',
  },
];

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MultiSkillHomeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const owlBounce = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(owlBounce, { toValue: -6, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(owlBounce, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(2500),
      ])
    ).start();
  }, []);

  const handleSimulateAndDiagnose = async () => {
    setLoading(true);
    const simulatedPayload = {
      user_id: 'default_user',
      phoneme_accuracy: Math.random() * 0.5 + 0.4,
      phoneme_avg_response_ms: Math.random() * 2000 + 1000,
      phoneme_wrong_taps: Math.floor(Math.random() * 5),
      phoneme_levels_cleared: Math.floor(Math.random() * 3) + 1,
      sound_match_accuracy: Math.random() * 0.5 + 0.4,
      sound_avg_time_s: Math.random() * 10 + 5,
      sound_retry_count: Math.floor(Math.random() * 4),
      sound_correct_first_try: Math.random() * 0.5 + 0.3,
      visual_seq_accuracy: Math.random() * 0.5 + 0.3,
      visual_seq_errors: Math.floor(Math.random() * 6),
      visual_seq_time_s: Math.random() * 15 + 10,
      visual_reversal_errors: Math.floor(Math.random() * 4),
      word_builder_score: Math.floor(Math.random() * 50) + 30,
      word_builder_time_s: Math.random() * 20 + 15,
      word_letter_swap_errors: Math.floor(Math.random() * 3),
      word_attempts: Math.floor(Math.random() * 3) + 1,
      hint_used_ratio: Math.random() * 0.5,
      total_session_time_min: Math.random() * 10 + 5,
      session_completion_rate: Math.random() * 0.4 + 0.6,
      frustration_exits: Math.floor(Math.random() * 2),
    };

    try {
      await predictSession(simulatedPayload);
      setLoading(false);
      navigation.navigate('MultiSkillProgress', { userId: 'default_user' });
    } catch (error) {
      setLoading(false);
      Alert.alert('Oops!', 'Could not connect to the server. Please try again later. 🦉');
    }
  };

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
          <Text style={styles.topTitle}>Fun Games</Text>
          <View style={styles.topSpacer} />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: 32 + insets.bottom + 70 }]}
        >
          {/* Header card with owl */}
          <View style={styles.headerCard}>
            <Animated.View style={{ transform: [{ translateY: owlBounce }] }}>
              <TinyOwl size={64} />
            </Animated.View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Fun Games! 🎮</Text>
              <Text style={styles.headerSub}>Pick a game to play</Text>
            </View>
            <BackendStatusDot backendKey="multiSkill" />
          </View>

          {/* Game cards */}
          <View style={styles.gameList}>
            {GAMES.map((game, i) => (
              <GameCard
                key={game.route}
                title={game.title}
                description={game.description}
                emoji={game.emoji}
                gradientColors={game.gradientColors}
                onPress={() => navigation.navigate(game.route)}
                delay={i * 80}
              />
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Diagnose button */}
          <TouchableOpacity
            onPress={handleSimulateAndDiagnose}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.purple, colors.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.diagnoseBtn}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.diagnoseBtnText}>📊 Check My Progress</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.diagnoseHint}>See how well you're doing overall!</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 22,
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
    fontSize: 18,
    color: colors.textPrimary,
  },
  topSpacer: {
    width: 40,
    height: 40,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },

  // Header
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#B987DC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  headerText: { flex: 1, marginLeft: 12 },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },

  // Game cards
  gameList: {},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardEmoji: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardEmojiText: { fontSize: 26 },
  cardText: { flex: 1 },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  cardDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.darkGrey,
    marginTop: 3,
  },
  cardArrow: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
    marginLeft: 8,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#9CA3AF',
    marginHorizontal: 12,
  },

  // Diagnose button
  diagnoseBtn: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  diagnoseBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: 'white',
  },
  diagnoseHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
