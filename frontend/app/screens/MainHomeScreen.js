import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse, Circle, Polygon } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { scale, moderateScale } from '../utils/responsive';

const { width } = Dimensions.get('window');

// ── Inline compact owl for header ─────────────────────────────────────────────
const HeaderOwl = ({ size = 56 }) => (
  <Svg viewBox="0 0 100 100" width={size} height={size}>
    <Ellipse cx="50" cy="65" rx="30" ry="32" fill="#B987DC" />
    <Ellipse cx="22" cy="68" rx="14" ry="22" fill="#96ADFC" />
    <Ellipse cx="78" cy="68" rx="14" ry="22" fill="#96ADFC" />
    <Ellipse cx="50" cy="72" rx="18" ry="20" fill="#EDE9FE" opacity="0.8" />
    <Circle cx="50" cy="38" r="28" fill="#B987DC" />
    <Polygon points="35,12 30,2 40,10" fill="#96ADFC" />
    <Polygon points="65,12 70,2 60,10" fill="#96ADFC" />
    <Circle cx="39" cy="36" r="13" fill="white" />
    <Circle cx="61" cy="36" r="13" fill="white" />
    <Circle cx="39" cy="36" r="9" fill="#A8F29A" />
    <Circle cx="61" cy="36" r="9" fill="#A8F29A" />
    <Circle cx="40" cy="36" r="5" fill="#2C3E50" />
    <Circle cx="62" cy="36" r="5" fill="#2C3E50" />
    <Circle cx="38" cy="33" r="2" fill="white" />
    <Circle cx="60" cy="33" r="2" fill="white" />
    <Polygon points="50,42 45,50 55,50" fill="#EDDD6D" />
    <Polygon points="50,15 52,21 58,21 53,25 55,31 50,27 45,31 47,25 42,21 48,21" fill="#EDDD6D" />
  </Svg>
);

// ── Floating decoration ───────────────────────────────────────────────────────
const Sparkle = ({ x, y, emoji = '⭐', size = 14, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] });
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y }, { transform: [{ translateY }], opacity }]}>
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
};

// ── Module card data ─────────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'photoSpelling',
    title: 'Photo Spelling',
    subtitle: 'Snap & spell fun words!',
    emoji: '📸',
    badge: '📷',
    gradientColors: ['#A8F29A', '#A5F7E1'],
    route: 'PhotoSpellingModule',
    available: true,
  },
  {
    id: 'writingMath',
    title: 'Write & Count',
    subtitle: 'Draw letters and numbers!',
    emoji: '✏️',
    badge: '🔢',
    gradientColors: ['#96ADFC', '#B987DC'],
    route: 'WritingMathModule',
    available: true,
  },
  {
    id: 'multiSkill',
    title: 'Fun Games',
    subtitle: 'Play and learn together!',
    emoji: '🎮',
    badge: '🏆',
    gradientColors: ['#EDD1B0', '#EDDD6D'],
    route: 'MultiSkillModule',
    available: true,
  },
  {
    id: 'actions',
    title: 'Actions',
    subtitle: 'Memory Test & Follow Instructions!',
    emoji: '🧩',
    badge: '🎯',
    gradientColors: ['#96ADFC', '#DBE1F1'],
    route: 'Actions',
    available: true,
  },
];

// ── Animated module card ──────────────────────────────────────────────────────
const ModuleCard = ({ mod, onPress, enterDelay }) => {
  const pressScale = useRef(new Animated.Value(1)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;
  const enterSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterAnim, {
        toValue: 1,
        duration: 500,
        delay: enterDelay,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(enterSlide, {
        toValue: 0,
        duration: 500,
        delay: enterDelay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    if (!mod.available) return;
    Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: enterAnim,
        transform: [{ translateY: enterSlide }, { scale: pressScale }],
        marginBottom: scale(12),
      }}
    >
      <TouchableOpacity
        activeOpacity={mod.available ? 0.88 : 1}
        onPress={() => mod.available && onPress(mod.route)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.cardOuter, !mod.available && { opacity: 0.55 }]}
      >
        <LinearGradient
          colors={mod.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Large emoji icon */}
          <View style={styles.cardEmojiWrap}>
            <Text style={styles.cardEmoji}>{mod.emoji}</Text>
          </View>

          {/* Text */}
          <View style={styles.cardTextBlock}>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={styles.cardSubtitle}>{mod.subtitle}</Text>
          </View>

          {/* Badge */}
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{mod.badge}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const MainHomeScreen = ({ navigation }) => {
  // Owl wink animation (alternating eyes)
  const owlBounce = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(owlBounce, { toValue: -6, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(owlBounce, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(2000),
      ])
    ).start();
  }, []);

  const handleNavigate = (route) => {
    navigation.navigate(route);
  };

  return (
    <LinearGradient
      colors={['#F8FAFC', '#EDE9FE', '#DBE1F1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      {/* Background sparkles */}
      <Sparkle x={20} y={100} emoji="⭐" size={14} delay={0} />
      <Sparkle x={width - 40} y={130} emoji="✨" size={16} delay={500} />
      <Sparkle x={width / 2 - 10} y={80} emoji="🌟" size={12} delay={1000} />
      <Sparkle x={width - 60} y={300} emoji="⭐" size={10} delay={300} />
      <Sparkle x={30} y={360} emoji="✨" size={12} delay={1200} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          {/* Owl avatar */}
          <Animated.View style={{ transform: [{ translateY: owlBounce }] }}>
            <View style={styles.owlWrap}>
              <HeaderOwl size={56} />
            </View>
          </Animated.View>

          {/* Greeting */}
          <View style={styles.headerText}>
            <Text style={styles.headerHello}>Hello, Superstar! 🌟</Text>
            <Text style={styles.headerSub}>What do you want to learn today?</Text>
          </View>

        </Animated.View>

        {/* ── Scrollable content ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scale(32) + insets.bottom + 70 }]}
        >
          {/* Section label */}
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionTitle}>🎯 Choose an Activity</Text>
            <Text style={styles.sectionSub}>Tap a card to start!</Text>
          </View>

          {/* Module cards */}
          <View style={styles.cardList}>
            {MODULES.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                mod={mod}
                onPress={handleNavigate}
                enterDelay={i * 80}
              />
            ))}
          </View>

          {/* Motivational footer */}
          <View style={styles.motivationCard}>
            <Text style={styles.motivationText}>🦉 Ollie says: "You're doing amazing! Keep going!"</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: scale(12),
    marginTop: scale(8),
    borderRadius: scale(22),
    shadowColor: '#B987DC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  owlWrap: {
    marginRight: scale(10),
    shadowColor: '#B987DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: { flex: 1 },
  headerHello: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(16),
    color: '#2D0C57',
  },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: moderateScale(12),
    color: '#7C3AED',
    marginTop: scale(2),
  },

  // Scroll
  scrollContent: {
    paddingTop: scale(16),
    paddingHorizontal: scale(12),
    paddingBottom: scale(32),
  },

  // Section label
  sectionLabel: {
    marginBottom: scale(12),
    paddingHorizontal: scale(4),
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(20),
    color: '#2D0C57',
  },
  sectionSub: {
    fontFamily: fonts.regular,
    fontSize: moderateScale(13),
    color: '#7C3AED',
    marginTop: scale(2),
  },

  // Cards
  cardList: {},
  cardOuter: {
    borderRadius: scale(22),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(18),
  },
  cardEmojiWrap: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(14),
  },
  cardEmoji: { fontSize: moderateScale(28) },
  cardTextBlock: { flex: 1 },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: moderateScale(17),
    color: '#1F2937',
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: moderateScale(12),
    color: '#374151',
    marginTop: scale(3),
  },
  cardBadge: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBadgeText: { fontSize: moderateScale(20) },

  // Motivation footer
  motivationCard: {
    marginTop: scale(8),
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: scale(20),
    padding: scale(16),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(185,135,220,0.3)',
  },
  motivationText: {
    fontFamily: fonts.regular,
    fontSize: moderateScale(13),
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MainHomeScreen;
