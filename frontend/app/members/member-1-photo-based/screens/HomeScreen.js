// HomeScreen — main menu for the Photo Spelling module; shows navigation cards for camera, challenges, and progress

import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Circle, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import BackendStatusDot from '../../../components/ui/BackendStatusDot';
import { colors, fonts } from '../../../theme';
import BackButton from '../../../components/BackButton';

// Inline SVG owl mascot drawn with basic shapes
const TinyOwl = ({ size = 48 }) => (
  <Svg viewBox="0 0 100 100" width={size} height={size}>
    <Ellipse cx="50" cy="65" rx="30" ry="32" fill={colors.green} />
    <Ellipse cx="22" cy="68" rx="14" ry="22" fill={colors.turquoise} />
    <Ellipse cx="78" cy="68" rx="14" ry="22" fill={colors.turquoise} />
    <Ellipse cx="50" cy="72" rx="18" ry="20" fill="#E6F4EA" opacity="0.8" />
    <Circle cx="50" cy="38" r="28" fill={colors.green} />
    <Polygon points="35,12 30,2 40,10" fill={colors.turquoise} />
    <Polygon points="65,12 70,2 60,10" fill={colors.turquoise} />
    <Circle cx="39" cy="36" r="13" fill="white" />
    <Circle cx="61" cy="36" r="13" fill="white" />
    <Circle cx="39" cy="36" r="9" fill={colors.purple} />
    <Circle cx="61" cy="36" r="9" fill={colors.purple} />
    <Circle cx="40" cy="36" r="5" fill="#2C3E50" />
    <Circle cx="62" cy="36" r="5" fill="#2C3E50" />
    <Circle cx="38" cy="33" r="2" fill="white" />
    <Circle cx="60" cy="33" r="2" fill="white" />
    <Polygon points="50,42 45,50 55,50" fill={colors.orange} />
  </Svg>
);

// Animated card — fades in + slides up on mount; scales down slightly on press
const GameCard = ({ title, description, emoji, gradientColors, onPress, delay = 0 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  // Entrance animation: fade in + slide up, staggered by `delay` ms
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

// Main screen component
export default function HomeScreen({ onNavigate, onBack }) {
  // owlBounce drives the gentle up-down float animation on the owl icon
  const owlBounce = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Loop: move owl up 6px, back down, pause 2.5s, repeat
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(owlBounce, { toValue: -6, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(owlBounce, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(2500),
      ])
    ).start();
  }, []);

  // Each entry maps to one GameCard; route is the screen name passed to onNavigate
  const GAMES = [
    {
      title: 'Take Photo',
      description: 'Start a spelling challenge!',
      emoji: '📷',
      gradientColors: ['#DBE1F1', '#A5F7E1'],
      route: 'camera',
    },
    {
      title: 'Challenges',
      description: 'Continue learning words!',
      emoji: '🏆',
      gradientColors: ['#EDE9FE', '#B987DC'],
      route: 'challenges',
    },
    {
      title: 'Progress',
      description: 'See your stats and awards',
      emoji: '📊',
      gradientColors: ['#EDD1B0', '#EDDD6D'],
      route: 'progress',
    },
  ];

  return (
    <LinearGradient
      colors={['#F8FAFC', '#E6F4EA', '#DBE1F1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top bar with back button and title */}
        <View style={styles.topBar}>
          <BackButton onPress={onBack} />
          <Text style={styles.topTitle}>Photo Spelling Fun</Text>
          <View style={styles.topSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: 32 + insets.bottom + 70 }]}
        >
          {/* Header card: bouncing owl + BackendStatusDot (shows if server is online) */}
          <View style={styles.headerCard}>
            <Animated.View style={{ transform: [{ translateY: owlBounce }] }}>
              <TinyOwl size={64} />
            </Animated.View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Spelling Fun! 📷</Text>
              <Text style={styles.headerSub}>Snap a photo to spell</Text>
            </View>
            <BackendStatusDot backendKey="photoSpelling" />
          </View>

          {/* Game cards — each navigates to a different screen */}
          <View style={styles.gameList}>
            {GAMES.map((game, i) => (
              <GameCard
                key={game.route}
                title={game.title}
                description={game.description}
                emoji={game.emoji}
                gradientColors={game.gradientColors}
                onPress={() => onNavigate(game.route)}
                delay={i * 80}  // stagger entrance animations
              />
            ))}
          </View>
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#10B981',
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
  gameList: {
    marginTop: 8,
  },
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
});
