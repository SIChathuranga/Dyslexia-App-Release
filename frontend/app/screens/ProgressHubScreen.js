/**
 * ================================================================================
 * PROGRESS HUB SCREEN
 * ================================================================================
 *
 * Unified progress entry point for all main modules.
 * Links to:
 * - Photo Spelling progress (parent view)
 * - Writing & Math progress dashboard
 * - Fun Games progress report
 * ================================================================================
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, PenTool, Gamepad2, ChevronRight } from 'lucide-react-native';
import BackButton from '../components/BackButton';
import { colors, fonts } from '../theme';

const ProgressHubScreen = ({ navigation }) => {
  const cards = [
    {
      id: 'photo',
      title: 'Photo Spelling',
      subtitle: 'See spelling progress and accuracy',
      icon: Camera,
      iconBg: '#DCFCE7',
      action: () =>
        navigation.navigate('PhotoSpellingModule', {
          directScreen: 'progress',
          viewMode: 'parent',
        }),
    },
    {
      id: 'writingMath',
      title: 'Writing & Math',
      subtitle: 'View learning insights and reports',
      icon: PenTool,
      iconBg: '#E0E7FF',
      action: () => navigation.navigate('WritingMathModule', { screen: 'ProgressDashboard' }),
    },
    {
      id: 'funGames',
      title: 'Fun Games',
      subtitle: 'Check diagnosis and progress trend',
      icon: Gamepad2,
      iconBg: '#FEF3C7',
      action: () => navigation.navigate('MultiSkillModule', { screen: 'MultiSkillProgress' }),
    },
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
          <Text style={styles.headerTitle}>Progress Hub</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>All Progress</Text>
          <Text style={styles.pageSub}>Choose a module to view detailed progress</Text>

          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <TouchableOpacity
                key={card.id}
                style={styles.card}
                onPress={card.action}
                activeOpacity={0.85}
              >
                <View style={[styles.cardIcon, { backgroundColor: card.iconBg }]}>
                  <Icon size={22} color="#1F2937" />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSub}>{card.subtitle}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
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
    paddingBottom: 24,
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#1F2937',
    marginTop: 6,
  },
  pageSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#1F2937',
  },
  cardSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default ProgressHubScreen;
