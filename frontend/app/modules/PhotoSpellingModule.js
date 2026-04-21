/**
 * ================================================================================
 * PHOTO-BASED SPELLING CHALLENGE MODULE
 * ================================================================================
 *
 * Self-contained module wrapping the photo-based spelling challenge component.
 * This preserves the original internal state-based navigation without changes.
 *
 * Backend: FastAPI on port 8000 (Render Account 1)
 * Features: Object detection, speech-to-text, spelling verification
 * ================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator, Text, Vibration, Platform } from 'react-native';

// Import screens

import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import ObjectRecognitionScreen from '../screens/ObjectRecognitionScreen';
import SpeakNowScreen from '../screens/SpeakNowScreen';
import SuccessScreen from '../screens/SuccessScreen';
import ErrorScreen from '../screens/ErrorScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import { colors } from '../theme';
import { setApiRuntimeConfig, warmUpBackend } from '../services/api';
import { recordAttempt } from '../services/progressStorage';
import { getTodaysChallengeWords } from '../constants/challengeWords';
import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  getAccessibilityPreferences,
  saveAccessibilityPreferences,
} from '../services/accessibilityPreferences';

const PhotoSpellingModule = ({ navigation, route }) => {
  const CORRECT_HAPTIC_MS = 500;
  const INCORRECT_HAPTIC_MS = 1000;
  const IOS_HAPTIC_GAP_MS = 180;

  // Start directly on 'home' — no internal splash
  const [currentScreen, setCurrentScreen] = useState('home');
  const [detectedObject, setDetectedObject] = useState(null);
  const [progressViewMode, setProgressViewMode] = useState('child');
  const [todayChallengeWords] = useState(() => getTodaysChallengeWords());
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeCurrentIndex, setChallengeCurrentIndex] = useState(0);
  const [challengeCompletedWords, setChallengeCompletedWords] = useState([]);
  const [textSize, setTextSize] = useState(DEFAULT_ACCESSIBILITY_PREFERENCES.textSize);
  const [fontStyle, setFontStyle] = useState(DEFAULT_ACCESSIBILITY_PREFERENCES.fontStyle);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const hapticTimeoutsRef = useRef([]);
  const currentChallengeWord = challengeActive ? todayChallengeWords[challengeCurrentIndex] : null;
  const hasCompletedTodayChallenge =
    todayChallengeWords.length > 0 && challengeCompletedWords.length === todayChallengeWords.length;

  useEffect(() => {
    setApiRuntimeConfig({ offlineMode });
  }, [offlineMode]);

  // Wake up backend early — HF Spaces may be sleeping
  useEffect(() => {
    warmUpBackend().then((ok) => {
      if (!ok) console.log('Backend warm-up: not reachable yet (may still be waking)');
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const accessibilityPreferences = await getAccessibilityPreferences();

        if (isMounted) {
          setTextSize(accessibilityPreferences.textSize || DEFAULT_ACCESSIBILITY_PREFERENCES.textSize);
          setFontStyle(accessibilityPreferences.fontStyle || DEFAULT_ACCESSIBILITY_PREFERENCES.fontStyle);
        }
      } catch (error) {
        console.error('Failed to restore app preferences:', error);
      } finally {
        if (isMounted) {
          setPrefsLoaded(true);
        }
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      hapticTimeoutsRef.current.forEach(clearTimeout);
      hapticTimeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!prefsLoaded) {
      return;
    }

    saveAccessibilityPreferences({ textSize, fontStyle }).catch((error) => {
      console.warn('Failed to save accessibility preferences:', error);
    });
  }, [prefsLoaded, textSize, fontStyle]);

  // Navigation handler
  const navigateTo = (screen, options = {}) => {
    if (screen === 'progress') {
      setProgressViewMode(options.viewMode === 'parent' ? 'parent' : 'child');
    }
    console.log('Navigating to:', screen);
    setCurrentScreen(screen);
  };

  useEffect(() => {
    const directScreen = route?.params?.directScreen;
    if (!directScreen) {
      return;
    }

    navigateTo(directScreen, { viewMode: route?.params?.viewMode });
    navigation.setParams({ directScreen: undefined, viewMode: undefined });
  }, [route?.params?.directScreen, route?.params?.viewMode]);

  // Object detection handler
  const handleObjectDetected = (objectData) => {
    console.log('Object Detected:', objectData);
    setDetectedObject(objectData);
    setCurrentScreen('recognition');
  };

  const startTodayChallenge = () => {
    setDetectedObject(null);
    setChallengeCompletedWords([]);
    setChallengeCurrentIndex(0);
    setChallengeActive(true);
    setCurrentScreen('camera');
  };

  const handleStartFreePractice = () => {
    setDetectedObject(null);
    setChallengeActive(false);
    setChallengeCurrentIndex(0);
    setCurrentScreen('camera');
  };

  const handleExitChallenge = () => {
    setDetectedObject(null);
    setChallengeActive(false);
    setChallengeCurrentIndex(0);
    setChallengeCompletedWords([]);
    setCurrentScreen('challenges');
  };

  const waitForHaptic = (durationMs) => new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      hapticTimeoutsRef.current = hapticTimeoutsRef.current.filter((id) => id !== timeoutId);
      resolve();
    }, durationMs);

    hapticTimeoutsRef.current.push(timeoutId);
  });

  const clearPendingHaptics = () => {
    hapticTimeoutsRef.current.forEach(clearTimeout);
    hapticTimeoutsRef.current = [];
    Vibration.cancel();
  };

  const triggerAnswerHaptic = async (isCorrect) => {
    if (!hapticEnabled) return;

    clearPendingHaptics();

    if (isCorrect) {
      if (Platform.OS === 'ios') {
        Vibration.vibrate();
        await waitForHaptic(CORRECT_HAPTIC_MS);
        return;
      }

      Vibration.vibrate(CORRECT_HAPTIC_MS);
      await waitForHaptic(CORRECT_HAPTIC_MS);
      return;
    }

    if (Platform.OS === 'ios') {
      Vibration.vibrate([0, IOS_HAPTIC_GAP_MS], true);
      await waitForHaptic(INCORRECT_HAPTIC_MS);
      Vibration.cancel();
      return;
    }

    Vibration.vibrate(INCORRECT_HAPTIC_MS);
    await waitForHaptic(INCORRECT_HAPTIC_MS);
  };

  // Speech evaluation handler
  const handleSpeechComplete = async (isMatch, transcribedText) => {
    const isCorrect = Boolean(isMatch);
    console.log('Speech result:', { isCorrect, transcribedText });

    const word = detectedObject?.label || '';
    recordAttempt(word, isCorrect).catch(console.error);

    if (isCorrect && challengeActive && currentChallengeWord) {
      setChallengeCompletedWords((prev) =>
        prev.includes(currentChallengeWord) ? prev : [...prev, currentChallengeWord]
      );
    }

    await triggerAnswerHaptic(isCorrect);

    if (isCorrect) {
      setCurrentScreen('success');
    } else {
      setCurrentScreen('error');
    }
  };

  // Reset handler
  const handleReset = () => {
    setDetectedObject(null);
    setChallengeActive(false);
    setChallengeCurrentIndex(0);
    setCurrentScreen('home');
  };

  const handleSuccessContinue = () => {
    if (challengeActive) {
      const isLastChallengeWord = challengeCurrentIndex >= todayChallengeWords.length - 1;

      if (isLastChallengeWord) {
        setDetectedObject(null);
        setChallengeActive(false);
        setChallengeCurrentIndex(0);
        setCurrentScreen('challenges');
        return;
      }

      setDetectedObject(null);
      setChallengeCurrentIndex((prev) => prev + 1);
      setCurrentScreen('camera');
      return;
    }

    handleReset();
  };

  // Show loading screen while preferences are loading
  if (!prefsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Screen renderer
  const renderScreen = () => {
    switch (currentScreen) {

      case 'home':
        return <HomeScreen onNavigate={navigateTo} onBack={() => navigation.navigate('MainHome')} />;

      case 'camera':
        return (
          <CameraScreen
            onObjectDetected={handleObjectDetected}
            onClose={challengeActive ? handleExitChallenge : handleReset}
            challengeWord={currentChallengeWord}
            challengeWords={todayChallengeWords}
            completedWords={challengeCompletedWords}
          />
        );

      case 'recognition':
        return (
          <ObjectRecognitionScreen
            detectedObject={detectedObject}
            onStartChallenge={() => navigateTo('speak')}
            onHome={challengeActive ? handleExitChallenge : handleReset}
            challengeWord={currentChallengeWord}
            challengeIndex={challengeCurrentIndex}
            challengeTotal={todayChallengeWords.length}
            completedChallengeCount={challengeCompletedWords.length}
          />
        );

      case 'speak':
        return (
          <SpeakNowScreen
            detectedObject={detectedObject}
            onComplete={handleSpeechComplete}
            onRetry={() => navigateTo('speak')}
            onHome={challengeActive ? handleExitChallenge : handleReset}
          />
        );

      case 'success':
        return (
          <SuccessScreen
            onContinue={handleSuccessContinue}
            onHome={challengeActive ? handleExitChallenge : handleReset}
            challengeMode={challengeActive}
            completedCount={challengeCompletedWords.length}
            totalCount={todayChallengeWords.length}
            isFinalChallengeWord={challengeActive && challengeCurrentIndex >= todayChallengeWords.length - 1}
            nextWord={
              challengeActive && challengeCurrentIndex < todayChallengeWords.length - 1
                ? todayChallengeWords[challengeCurrentIndex + 1]
                : null
            }
          />
        );

      case 'error':
        return (
          <ErrorScreen
            detectedObject={detectedObject}
            onRetry={() => navigateTo('speak')}
            onHome={challengeActive ? handleExitChallenge : handleReset}
          />
        );

      case 'progress':
        return (
          <ProgressScreen
            onBack={() => navigateTo('home')}
            initialViewMode={progressViewMode}
            childName={'Learner'}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            onBack={() => navigateTo('home')}
            onOpenParentDashboard={() => navigateTo('progress', { viewMode: 'parent' })}
            hapticEnabled={hapticEnabled}
            offlineMode={offlineMode}
            onToggleHaptic={setHapticEnabled}
            onToggleOfflineMode={setOfflineMode}
            textSize={textSize}
            fontStyle={fontStyle}
            onChangeTextSize={setTextSize}
            onChangeFontStyle={setFontStyle}
          />
        );

      case 'challenges':
        return (
          <ChallengesScreen
            onBack={() => navigateTo('home')}
            onStartPhotoChallenge={handleStartFreePractice}
            onStartTodayChallenge={startTodayChallenge}
            onViewProgress={() => navigateTo('progress')}
            todayChallengeWords={todayChallengeWords}
            completedChallengeWords={challengeCompletedWords}
            hasCompletedTodayChallenge={hasCompletedTodayChallenge}
            challengeCurrentIndex={challengeCurrentIndex}
            challengeActive={challengeActive}
          />
        );

      default:
        return <HomeScreen onNavigate={navigateTo} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blueGrey,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default PhotoSpellingModule;
