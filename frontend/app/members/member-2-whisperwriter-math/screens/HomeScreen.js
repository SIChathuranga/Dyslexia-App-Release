/**
 * ================================================================================
 * HOME SCREEN
 * ================================================================================
 *
 * The main menu screen of the Writing & Math Module.
 * Uses dyslexia-friendly colors, OpenDyslexic font, and animated game cards.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, StatusBar, } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Circle, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { speak } from '../tts/speak';
import BackendStatusDot from '../../../components/ui/BackendStatusDot';
// Shared theme
import { colors, fonts } from '../../../theme';
import BackButton from '../../../components/BackButton';
// ── Small inline owl icon ─────────────────────────────────────────────────────
const TinyOwl = ({ size = 48 }) => (<Svg viewBox="0 0 100 100" width={size} height={size}>
    <Ellipse cx="50" cy="65" rx="30" ry="32" fill={colors.purple}/>
    <Ellipse cx="22" cy="68" rx="14" ry="22" fill={colors.blue}/>
    <Ellipse cx="78" cy="68" rx="14" ry="22" fill={colors.blue}/>
    <Ellipse cx="50" cy="72" rx="18" ry="20" fill="#EDE9FE" opacity="0.8"/>
    <Circle cx="50" cy="38" r="28" fill={colors.purple}/>
    <Polygon points="35,12 30,2 40,10" fill={colors.blue}/>
    <Polygon points="65,12 70,2 60,10" fill={colors.blue}/>
    <Circle cx="39" cy="36" r="13" fill="white"/>
    <Circle cx="61" cy="36" r="13" fill="white"/>
    <Circle cx="39" cy="36" r="9" fill={colors.green}/>
    <Circle cx="61" cy="36" r="9" fill={colors.green}/>
    <Circle cx="40" cy="36" r="5" fill="#2C3E50"/>
    <Circle cx="62" cy="36" r="5" fill="#2C3E50"/>
    <Circle cx="38" cy="33" r="2" fill="white"/>
    <Circle cx="60" cy="33" r="2" fill="white"/>
    <Polygon points="50,42 45,50 55,50" fill={colors.orange}/>
  </Svg>);
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
    }, [delay, fadeIn, slideUp]);
    return (<Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }, { scale }], marginBottom: 12 }}>
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()} onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start()}>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
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
    </Animated.View>);
};
// ── Main screen ───────────────────────────────────────────────────────────────
export const HomeScreen = ({ navigation }) => {
    const owlBounce = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();
    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(owlBounce, { toValue: -6, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(owlBounce, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.delay(2500),
        ])).start();
    }, [owlBounce]);
    const GAMES = [
        {
            title: 'Letters',
            description: 'Practice writing A-Z',
            emoji: '✏️',
            gradientColors: ['#DBE1F1', '#A5F7E1'],
            route: 'LetterPractice',
            speakText: "Let's practice letters!",
        },
        {
            title: 'Math',
            description: 'Solve fun problems',
            emoji: '🔢',
            gradientColors: ['#EDE9FE', '#96ADFC'],
            route: 'MathPractice',
            speakText: "Let's do some math!",
        },
        {
            title: 'Word Count',
            description: 'Count letters in words',
            emoji: '📝',
            gradientColors: ['#EDD1B0', '#EDDD6D'],
            route: 'WordCountPractice',
            speakText: "Let's count letters in words!",
        },
        {
            title: 'Letter Hunt',
            description: 'Find letters in number words',
            emoji: '🔍',
            gradientColors: ['#A8F29A', '#A5F7E1'],
            route: 'LetterInWord',
            speakText: "Let's find letters in words!",
        },
        {
            title: 'Progress',
            description: 'View learning insights',
            emoji: '📊',
            gradientColors: ['#F3E8FF', '#FCE7F3'],
            route: 'ProgressDashboard',
            speakText: "Let's see your progress!",
        },
    ];
    const handleFeaturePress = (game) => {
        speak(game.speakText);
        navigation.navigate(game.route);
    };
    return (<LinearGradient colors={['#F8FAFC', '#EDE9FE', '#DBE1F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC"/>
        <View style={styles.topBar}>
                    <BackButton onPress={() => navigation.navigate('MainHome')} />
          <Text style={styles.topTitle}>Write & Count</Text>
          <View style={styles.topSpacer}/>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: 32 + insets.bottom + 70 }]}>
          {/* Header card with owl */}
          <View style={styles.headerCard}>
            <Animated.View style={{ transform: [{ translateY: owlBounce }] }}>
              <TinyOwl size={64}/>
            </Animated.View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Write & Count! ✏️</Text>
              <Text style={styles.headerSub}>What do you want to play?</Text>
            </View>
                        <BackendStatusDot backendKey="writingMath" />
          </View>

          {/* Game cards */}
          <View style={styles.gameList}>
            {GAMES.map((game, i) => (<GameCard key={game.route} title={game.title} description={game.description} emoji={game.emoji} gradientColors={game.gradientColors} onPress={() => handleFeaturePress(game)} delay={i * 80}/>))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>);
};
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
