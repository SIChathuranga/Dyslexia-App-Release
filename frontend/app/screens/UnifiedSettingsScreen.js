/**
 * ================================================================================
 * UNIFIED SETTINGS SCREEN
 * ================================================================================
 *
 * Single consolidated settings page that replaces all per-module settings.
 * Features: Text Size, Font Style, Haptic Feedback, Parent Dashboard, App Info.
 * Back navigates to Main Home.
 * Uses dyslexia-friendly colors and OpenDyslexic font throughout.
 * ================================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Type, Smartphone, Users, ChevronRight, Info } from 'lucide-react-native';
import { colors, fonts } from '../theme';
import BackButton from '../components/BackButton';
import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  getAccessibilityPreferences,
  saveAccessibilityPreferences,
} from '../services/accessibilityPreferences';

// Helper Section wrapper
const SettingsSection = ({ icon: Icon, iconBg, title, children }) => (
  <View style={sectionStyles.wrapper}>
    <View style={sectionStyles.header}>
      <View style={[sectionStyles.iconBg, { backgroundColor: iconBg }]}>
        <Icon size={20} color="#1F2937" />
      </View>
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
    {children}
  </View>
);

const sectionStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#1F2937',
  },
});

// ── Main component ────────────────────────────────────────────────────────────
const UnifiedSettingsScreen = ({ navigation }) => {
  const [textSize, setTextSizeState] = useState(DEFAULT_ACCESSIBILITY_PREFERENCES.textSize);
  const [fontStyle, setFontStyleState] = useState(DEFAULT_ACCESSIBILITY_PREFERENCES.fontStyle);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  // Entrance animation
  const fadeIn = React.useRef(new Animated.Value(0)).current;
  const slideUp = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Load saved preferences
    getAccessibilityPreferences()
      .then((prefs) => {
        setTextSizeState(prefs.textSize || DEFAULT_ACCESSIBILITY_PREFERENCES.textSize);
        setFontStyleState(prefs.fontStyle || DEFAULT_ACCESSIBILITY_PREFERENCES.fontStyle);
      })
      .catch(() => {});

    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleTextSize = (size) => {
    setTextSizeState(size);
    saveAccessibilityPreferences({ textSize: size, fontStyle }).catch(() => {});
  };

  const handleFontStyle = (style) => {
    setFontStyleState(style);
    saveAccessibilityPreferences({ textSize, fontStyle: style }).catch(() => {});
  };

  const sizeLabels = { small: 'Small A', medium: 'Medium A', large: 'Large A' };
  const sizeFontSizes = { small: 13, medium: 16, large: 20 };

  return (
    <LinearGradient
      colors={['#DBE1F1', '#EDE9FE', '#FCE7F3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header bar */}
        <View style={styles.headerBar}>
          <BackButton onPress={() => navigation.navigate('MainHome')} />
          <Text style={styles.headerTitle}>Settings ⚙️</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

            {/* ── Text Size ── */}
            <SettingsSection icon={Type} iconBg="#EDE9FE" title="Text Size">
              <View style={styles.sizeRow}>
                {['small', 'medium', 'large'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sizeBtn, textSize === s && styles.sizeBtnActive]}
                    onPress={() => handleTextSize(s)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.sizeBtnText,
                        { fontSize: sizeFontSizes[s] },
                        textSize === s && styles.sizeBtnTextActive,
                      ]}
                    >
                      {sizeLabels[s]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SettingsSection>

            {/* ── Font Style ── */}
            <SettingsSection icon={Type} iconBg="#E0F2FE" title="Font Style">
              {[
                { value: 'opendyslexic', label: 'OpenDyslexic', family: fonts.bold },
                { value: 'sans-serif', label: 'Clean Sans Serif', family: undefined, weight: '700' },
              ].map((f) => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.fontBtn, fontStyle === f.value && styles.fontBtnActive]}
                  onPress={() => handleFontStyle(f.value)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.fontBtnText,
                      { fontFamily: f.family, fontWeight: f.weight },
                      fontStyle === f.value && styles.fontBtnTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                  {fontStyle === f.value && <ChevronRight size={18} color="white" />}
                </TouchableOpacity>
              ))}
            </SettingsSection>

            {/* ── Haptic Feedback ── */}
            <SettingsSection icon={Smartphone} iconBg="#D1FAE5" title="Vibration">
              <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}>
                  <Smartphone size={20} color={colors.green} style={{ marginRight: 10 }} />
                  <Text style={styles.toggleLabel}>Haptic Feedback</Text>
                </View>
                <Switch
                  value={hapticEnabled}
                  onValueChange={setHapticEnabled}
                  trackColor={{ false: '#D1D5DB', true: colors.purple }}
                  thumbColor="white"
                />
              </View>
              <Text style={styles.toggleHint}>Phone will vibrate when you answer 🎮</Text>
            </SettingsSection>

            {/* ── Parent / Progress Dashboard ── */}
            <SettingsSection icon={Users} iconBg="#FCE7F3" title="Parent Area">
              <TouchableOpacity
                style={styles.parentBtn}
                onPress={() => navigation.navigate('ProgressHub')}
                activeOpacity={0.85}
              >
                <View style={styles.parentIcon}>
                  <Users size={20} color="#DB2777" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.parentBtnTitle}>Progress Dashboard</Text>
                  <Text style={styles.parentBtnSub}>View detailed learning reports</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </SettingsSection>

            {/* ── App Info ── */}
            <SettingsSection icon={Info} iconBg="#FEF3C7" title="About DysLearn">
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>For ages</Text>
                <Text style={styles.infoValue}>6 – 12 years</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Font</Text>
                <Text style={styles.infoValue}>OpenDyslexic</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Modules</Text>
                <Text style={styles.infoValue}>3 Active</Text>
              </View>
            </SettingsSection>

            {/* Footer note */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Designed with 💜 for children with dyslexia</Text>
            </View>

          </Animated.View>
        </ScrollView>
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
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Text size
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizeBtnActive: { backgroundColor: '#EDE9FE', borderColor: colors.purple },
  sizeBtnText: { fontFamily: fonts.bold, color: '#6B7280' },
  sizeBtnTextActive: { color: colors.purple },

  // Font style
  fontBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fontBtnActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  fontBtnText: { fontSize: 15, color: '#374151' },
  fontBtnTextActive: { color: 'white' },

  // Toggle
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center' },
  toggleLabel: { fontFamily: fonts.regular, fontSize: 15, color: '#374151' },
  toggleHint: { fontFamily: fonts.regular, fontSize: 12, color: '#9CA3AF', marginTop: 8 },

  // Parent btn
  parentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  parentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  parentBtnTitle: { fontFamily: fonts.bold, fontSize: 15, color: '#1F2937' },
  parentBtnSub: { fontFamily: fonts.regular, fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontFamily: fonts.regular, fontSize: 14, color: '#6B7280' },
  infoValue: { fontFamily: fonts.bold, fontSize: 14, color: '#1F2937' },

  // Footer
  footer: { alignItems: 'center', marginTop: 8 },
  footerText: { fontFamily: fonts.regular, fontSize: 13, color: '#9CA3AF' },
});

export default UnifiedSettingsScreen;
