/**
 * ================================================================================
 * WELCOME SCREEN - First-Time Onboarding
 * ================================================================================
 *
 * Shows only on the first launch (AsyncStorage flag).
 * Kids-friendly: animated owl mascot, bouncing stars, gradient background.
 * Dyslexia-friendly colors and OpenDyslexic font throughout.
 * ================================================================================
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Ellipse, Circle, Path, Polygon, G } from 'react-native-svg';
import { colors, fonts } from '../theme';

const { width, height } = Dimensions.get('window');
const WELCOME_SHOWN_KEY = '@dyslearn_welcome_shown';

// ── Animated SVG owl mascot ──────────────────────────────────────────────────
const OwlMascot = ({ size = 120 }) => (
  <Svg viewBox="0 0 100 100" width={size} height={size}>
    {/* Body */}
    <Ellipse cx="50" cy="65" rx="30" ry="32" fill="#B987DC" />
    {/* Wing left */}
    <Ellipse cx="22" cy="68" rx="14" ry="22" fill="#96ADFC" />
    {/* Wing right */}
    <Ellipse cx="78" cy="68" rx="14" ry="22" fill="#96ADFC" />
    {/* Belly */}
    <Ellipse cx="50" cy="72" rx="18" ry="20" fill="#EDE9FE" opacity="0.8" />
    {/* Head */}
    <Circle cx="50" cy="38" r="28" fill="#B987DC" />
    {/* Ear tufts */}
    <Polygon points="35,12 30,2 40,10" fill="#96ADFC" />
    <Polygon points="65,12 70,2 60,10" fill="#96ADFC" />
    {/* Eye whites */}
    <Circle cx="39" cy="36" r="13" fill="white" />
    <Circle cx="61" cy="36" r="13" fill="white" />
    {/* Eye irises */}
    <Circle cx="39" cy="36" r="9" fill="#A8F29A" />
    <Circle cx="61" cy="36" r="9" fill="#A8F29A" />
    {/* Pupils */}
    <Circle cx="40" cy="36" r="5" fill="#2C3E50" />
    <Circle cx="62" cy="36" r="5" fill="#2C3E50" />
    {/* Eye shine */}
    <Circle cx="38" cy="33" r="2" fill="white" />
    <Circle cx="60" cy="33" r="2" fill="white" />
    {/* Beak */}
    <Polygon points="50,42 45,50 55,50" fill="#EDDD6D" />
    {/* Star on forehead */}
    <Polygon points="50,15 52,21 58,21 53,25 55,31 50,27 45,31 47,25 42,21 48,21" fill="#EDDD6D" />
  </Svg>
);

// ── Floating star decoration ─────────────────────────────────────────────────
const FloatingStar = ({ x, y, size = 16, delay = 0, color: c = '#EDDD6D' }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] });

  return (
    <Animated.View style={[styles.star, { left: x, top: y, transform: [{ translateY }], opacity }]}>
      <Text style={{ fontSize: size, color: c }}>⭐</Text>
    </Animated.View>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const WelcomeScreen = ({ onDone }) => {
  const [pressed, setPressed] = useState(false);

  // Owl bounce
  const owlBounce = useRef(new Animated.Value(0)).current;
  // Entrance fade
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  // Button pulse
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();

    // Owl bounce loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(owlBounce, { toValue: -14, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(owlBounce, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(800),
      ])
    ).start();

    // Button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(btnScale, { toValue: 1.05, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(btnScale, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleStart = async () => {
    setPressed(true);
    try {
      await AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    } catch (_) {}
    onDone();
  };

  return (
    <LinearGradient
      colors={['#DBE1F1', '#EDE9FE', '#FCE7F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Decorative floating stars */}
        <FloatingStar x={30} y={80} size={18} delay={0} />
        <FloatingStar x={width - 60} y={100} size={14} delay={400} color="#A8F29A" />
        <FloatingStar x={width / 2 - 20} y={50} size={12} delay={800} color="#96ADFC" />
        <FloatingStar x={60} y={height * 0.45} size={16} delay={200} color="#E0A6AA" />
        <FloatingStar x={width - 80} y={height * 0.5} size={20} delay={600} />
        <FloatingStar x={width / 2 + 50} y={height * 0.65} size={13} delay={1000} color="#A8F29A" />

        <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          {/* Owl mascot with bounce */}
          <Animated.View style={{ transform: [{ translateY: owlBounce }] }}>
            <View style={styles.mascotContainer}>
              <OwlMascot size={160} />
            </View>
          </Animated.View>

          {/* App name */}
          <View style={styles.titleBlock}>
            <Text style={styles.appName}>DysLearn 🌟</Text>
            <Text style={styles.tagline}>Learning is fun!</Text>
          </View>

          {/* Welcome message */}
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Welcome, Superstar! 🎉</Text>
            <Text style={styles.messageBody}>
              I'm Ollie the Owl, your learning buddy! Together we'll read, write, and play exciting games every day. Are you ready? 🚀
            </Text>
          </View>

          {/* CTA button */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.startButton, pressed && styles.startButtonPressed]}
              onPress={handleStart}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#B987DC', '#96ADFC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>Let's Start! 🚀</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.footnote}>Made with 💜 for young learners</Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

// ── Static helper ────────────────────────────────────────────────────────────
WelcomeScreen.shouldShow = async () => {
  try {
    const val = await AsyncStorage.getItem(WELCOME_SHOWN_KEY);
    return val !== 'true';
  } catch (_) {
    return true;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'center' },
  star: { position: 'absolute' },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  mascotContainer: {
    marginBottom: 8,
    shadowColor: '#B987DC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  titleBlock: { alignItems: 'center', marginBottom: 20 },
  appName: {
    fontFamily: fonts.bold,
    fontSize: 34,
    color: '#2D0C57',
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#7C3AED',
    marginTop: 4,
  },
  messageCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
    width: '100%',
    shadowColor: '#B987DC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  messageTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#2D0C57',
    marginBottom: 10,
    textAlign: 'center',
  },
  messageBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    textAlign: 'center',
  },
  startButton: {
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#B987DC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  startButtonPressed: { opacity: 0.88 },
  startButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 56,
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: 'white',
    letterSpacing: 0.3,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#9CA3AF',
  },
});

export default WelcomeScreen;
