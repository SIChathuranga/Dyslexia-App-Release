/**
 * ================================================================================
 * PHOTO-BASED SPELLING CHALLENGE MODULE
 * ================================================================================
 *
 * Self-contained module wrapping the photo-based spelling challenge component.
 * This preserves the original internal state-based navigation without changes.
 *
 * Backend: FastAPI on port 9000 (Hugging Face Spaces)
 * Features: Object detection, speech-to-text, spelling verification
 * ================================================================================
 */


import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator, Text, Vibration, Platform } from 'react-native';

// ── Screen imports ────────────────────────────────────────────────────────────
// Each screen is a separate component; this module decides which one to show
import HomeScreen from '../screens/HomeScreen';              
import CameraScreen from '../screens/CameraScreen';          
import ObjectRecognitionScreen from '../screens/ObjectRecognitionScreen'; 
import SpeakNowScreen from '../screens/SpeakNowScreen';      
import SuccessScreen from '../screens/SuccessScreen';         
import ErrorScreen from '../screens/ErrorScreen';             
import ProgressScreen from '../screens/ProgressScreen';       
import SettingsScreen from '../screens/SettingsScreen';       
import ChallengesScreen from '../screens/ChallengesScreen';   

// ── Shared utilities ──────────────────────────────────────────────────────────
import { colors } from '../../../theme';                                         
import { setApiRuntimeConfig, warmUpBackend } from '../../../services/api';      
import { recordAttempt } from '../services/progressStorage';                     
import { getTodaysChallengeWords } from '../constants/challengeWords';           
import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  getAccessibilityPreferences,
  saveAccessibilityPreferences,
} from '../../../services/accessibilityPreferences';  

// ── Main component ────────────────────────────────────────────────────────────
const PhotoSpellingModule = ({ navigation, route }) => {

  // Vibration durations (milliseconds) for correct vs wrong answers
  const CORRECT_HAPTIC_MS = 500;      
  const INCORRECT_HAPTIC_MS = 1000;   
  const IOS_HAPTIC_GAP_MS = 180;     

  // ── App state ───────────────────────────────────────────────────────────────

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

  // Shortcut: the word the child needs to spell right now (null if not in challenge mode)
  const currentChallengeWord = challengeActive ? todayChallengeWords[challengeCurrentIndex] : null;

  
  const hasCompletedTodayChallenge =
    todayChallengeWords.length > 0 && challengeCompletedWords.length === todayChallengeWords.length;



  // Whenever offlineMode changes, tell the API service so it stops hitting the network
  useEffect(() => {
    setApiRuntimeConfig({ offlineMode });
  }, [offlineMode]);

  // On first mount: ping the backend so it wakes up (Render free tier sleeps after inactivity)
  useEffect(() => {
    warmUpBackend().then((ok) => {
      if (!ok) console.log('Backend warm-up: not reachable yet (may still be waking)');
    });
  }, []);

  // On first mount: load the user's saved font/text preferences from device storage
  useEffect(() => {
    let isMounted = true; // prevents state update if the component unmounts during the async call

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
          setPrefsLoaded(true); // unblock the loading screen
        }
      }
    };

    loadPreferences();

    // Cleanup: mark as unmounted so the async callback doesn't set state on a dead component
    return () => {
      isMounted = false;
    };
  }, []);

  // On unmount: cancel any pending haptic timers to avoid memory leaks
  useEffect(() => {
    return () => {
      hapticTimeoutsRef.current.forEach(clearTimeout);
      hapticTimeoutsRef.current = [];
    };
  }, []);

  // Whenever textSize or fontStyle changes (after prefs are loaded), save the new value to storage
  useEffect(() => {
    if (!prefsLoaded) {
      return; // don't save defaults before we've loaded the real values
    }

    saveAccessibilityPreferences({ textSize, fontStyle }).catch((error) => {
      console.warn('Failed to save accessibility preferences:', error);
    });
  }, [prefsLoaded, textSize, fontStyle]);



  // Central navigation function — updates currentScreen state to show the right screen
  const navigateTo = (screen, options = {}) => {
    if (screen === 'progress') {
      // Decide if the progress screen shows child stats or parent dashboard
      setProgressViewMode(options.viewMode === 'parent' ? 'parent' : 'child');
    }
    console.log('Navigating to:', screen);
    setCurrentScreen(screen);
  };

  // Handle deep-link navigation — another part of the app can jump directly to a specific screen
  useEffect(() => {
    const directScreen = route?.params?.directScreen;
    if (!directScreen) {
      return;
    }

    navigateTo(directScreen, { viewMode: route?.params?.viewMode });
    
    navigation.setParams({ directScreen: undefined, viewMode: undefined });
  }, [route?.params?.directScreen, route?.params?.viewMode]);



  // Called by CameraScreen when the AI has identified an object in the photo
  const handleObjectDetected = (objectData) => {
    console.log('Object Detected:', objectData);
    setDetectedObject(objectData);       
    setCurrentScreen('recognition');     
  };

  // Start the structured daily challenge from the beginning
  const startTodayChallenge = () => {
    setDetectedObject(null);
    setChallengeCompletedWords([]);    
    setChallengeCurrentIndex(0);       
    setChallengeActive(true);
    setCurrentScreen('camera');        
  };

  // Start a free-practice session (no word list, child can photograph anything)
  const handleStartFreePractice = () => {
    setDetectedObject(null);
    setChallengeActive(false);        
    setChallengeCurrentIndex(0);
    setCurrentScreen('camera');
  };

  // Quit the challenge mid-way and return to the Challenges screen
  const handleExitChallenge = () => {
    setDetectedObject(null);
    setChallengeActive(false);
    setChallengeCurrentIndex(0);
    setChallengeCompletedWords([]);    
    setCurrentScreen('challenges');
  };



  // Returns a Promise that resolves after durationMs — used to time vibration patterns
  const waitForHaptic = (durationMs) => new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      hapticTimeoutsRef.current = hapticTimeoutsRef.current.filter((id) => id !== timeoutId);
      resolve();
    }, durationMs);

    hapticTimeoutsRef.current.push(timeoutId); // track so we can cancel it later
  });

  // Stop all in-progress vibrations and clear their timers
  const clearPendingHaptics = () => {
    hapticTimeoutsRef.current.forEach(clearTimeout);
    hapticTimeoutsRef.current = [];
    Vibration.cancel();
  };

  // Trigger the correct vibration pattern based on whether the answer was right or wrong
  const triggerAnswerHaptic = async (isCorrect) => {
    if (!hapticEnabled) return; // user turned haptics off in Settings

    clearPendingHaptics(); // cancel any leftover vibration from a previous answer

    if (isCorrect) {
      // iOS: single short buzz; Android: buzz for CORRECT_HAPTIC_MS
      if (Platform.OS === 'ios') {
        Vibration.vibrate();
        await waitForHaptic(CORRECT_HAPTIC_MS);
        return;
      }

      Vibration.vibrate(CORRECT_HAPTIC_MS);
      await waitForHaptic(CORRECT_HAPTIC_MS);
      return;
    }

    // Wrong answer — longer / repeating buzz to signal an error
    if (Platform.OS === 'ios') {
      // iOS needs an explicit [pause, duration] pattern array to repeat
      Vibration.vibrate([0, IOS_HAPTIC_GAP_MS], true);
      await waitForHaptic(INCORRECT_HAPTIC_MS);
      Vibration.cancel();
      return;
    }

    Vibration.vibrate(INCORRECT_HAPTIC_MS);
    await waitForHaptic(INCORRECT_HAPTIC_MS);
  };

  // Called when the speech-to-text result comes back from SpeakNowScreen
  const handleSpeechComplete = async (isMatch, transcribedText) => {
    const isCorrect = Boolean(isMatch); // convert to a plain boolean
    console.log('Speech result:', { isCorrect, transcribedText });

    // Save this attempt to local storage so the progress screen can display it later
    const word = detectedObject?.label || '';
    recordAttempt(word, isCorrect).catch(console.error);

    // In challenge mode, mark the current word as completed if the answer is correct
    if (isCorrect && challengeActive && currentChallengeWord) {
      setChallengeCompletedWords((prev) =>
        prev.includes(currentChallengeWord) ? prev : [...prev, currentChallengeWord]
      );
    }

    // Vibrate to give immediate physical feedback before changing screen
    await triggerAnswerHaptic(isCorrect);

    // Navigate to the appropriate result screen
    if (isCorrect) {
      setCurrentScreen('success');
    } else {
      setCurrentScreen('error');
    }
  };

  // Full reset — clears everything and returns to the home screen
  const handleReset = () => {
    setDetectedObject(null);
    setChallengeActive(false);
    setChallengeCurrentIndex(0);
    setCurrentScreen('home');
  };

  // Called when the child taps "Continue" on the Success screen
  const handleSuccessContinue = () => {
    if (challengeActive) {
      const isLastChallengeWord = challengeCurrentIndex >= todayChallengeWords.length - 1;

      if (isLastChallengeWord) {
        // All challenge words done — go back to the challenges screen
        setDetectedObject(null);
        setChallengeActive(false);
        setChallengeCurrentIndex(0);
        setCurrentScreen('challenges');
        return;
      }

      // Move to the next challenge word
      setDetectedObject(null);
      setChallengeCurrentIndex((prev) => prev + 1);
      setCurrentScreen('camera'); // child photographs the next object
      return;
    }

    // Not in challenge mode — just go back to home
    handleReset();
  };

  // ── Loading gate ────────────────────────────────────────────────────────────

  // Show a spinner while user preferences are still being read from storage
  if (!prefsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // ── Screen renderer ─────────────────────────────────────────────────────────

  // Decides which screen component to render based on the currentScreen state value
  const renderScreen = () => {
    switch (currentScreen) {

      // Home: main menu with options to start free practice, challenges, settings, etc.
      case 'home':
        return <HomeScreen onNavigate={navigateTo} onBack={() => navigation.navigate('MainHome')} />;

      // Camera: child points the camera at an object; AI detects it
      case 'camera':
        return (
          <CameraScreen
            onObjectDetected={handleObjectDetected}
            onClose={challengeActive ? handleExitChallenge : handleReset}
            challengeWord={currentChallengeWord}        // hint word shown during challenge
            challengeWords={todayChallengeWords}
            completedWords={challengeCompletedWords}
          />
        );

      // Recognition: shows what the AI detected and asks if the child wants to spell it
      case 'recognition':
        return (
          <ObjectRecognitionScreen
            detectedObject={detectedObject}
            onStartChallenge={() => navigateTo('speak')} // proceed to spelling
            onHome={challengeActive ? handleExitChallenge : handleReset}
            challengeWord={currentChallengeWord}
            challengeIndex={challengeCurrentIndex}
            challengeTotal={todayChallengeWords.length}
            completedChallengeCount={challengeCompletedWords.length}
          />
        );

      // Speak: child says the word aloud; speech-to-text checks the spelling
      case 'speak':
        return (
          <SpeakNowScreen
            detectedObject={detectedObject}
            onComplete={handleSpeechComplete}  // fires when recording is done
            onRetry={() => navigateTo('speak')}
            onHome={challengeActive ? handleExitChallenge : handleReset}
          />
        );

      // Success: shown when the child spelled the word correctly
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
              // Pass the next challenge word so SuccessScreen can preview it
              challengeActive && challengeCurrentIndex < todayChallengeWords.length - 1
                ? todayChallengeWords[challengeCurrentIndex + 1]
                : null
            }
          />
        );

      // Error: shown when the child's spelling didn't match; offers a retry
      case 'error':
        return (
          <ErrorScreen
            detectedObject={detectedObject}
            onRetry={() => navigateTo('speak')} // go back to SpeakNow to try again
            onHome={challengeActive ? handleExitChallenge : handleReset}
          />
        );

      // Progress: shows the child's attempt history and stats
      case 'progress':
        return (
          <ProgressScreen
            onBack={() => navigateTo('home')}
            initialViewMode={progressViewMode} // 'child' or 'parent'
            childName={'Learner'}
          />
        );

      // Settings: font size, font style, haptics toggle, offline mode toggle
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

      // Challenges: shows today's word list, start button, and completion status
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

      // Fallback: if an unknown screen name is set, show the home screen
      default:
        return <HomeScreen onNavigate={navigateTo} />;
    }
  };

  // ── Root layout ─────────────────────────────────────────────────────────────

  // Outer container fills the full screen; renderScreen() picks the right child component
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Full-screen wrapper for every screen
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
