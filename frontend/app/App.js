/**
 * ================================================================================
 * DYSLEARN - MERGED APPLICATION
 * ================================================================================
 *
 * Root component that hosts all learning modules under a unified navigation.
 *
 * MODULES:
 * --------
 * 1. Photo-Based Spelling Challenge  (Backend: FastAPI, Port 8000)
 * 2. Writing & Math Real-Time Feedback (Backend: Flask, Port 5000)
 * 3. Multi-Skill Learning Game         (Backend: Flask, Port 5001)
 *
 * Navigation:
 * -----------
 * - WelcomeScreen   : First-time animated onboarding (one-time only)
 * - MainHome        : Activity hub / module selector
 * - Settings        : Unified settings page (text size, font, haptic, etc.)
 * - PhotoSpellingModule / WritingMathModule / MultiSkillModule : learning modules
 *
 * ================================================================================
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Camera, PenTool, Gamepad2, Settings, Zap } from 'lucide-react-native';
import { useFonts } from 'expo-font';
import { colors } from './theme';

// Screens
import MainHomeScreen from './screens/MainHomeScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import UnifiedSettingsScreen from './screens/UnifiedSettingsScreen';
import ProgressHubScreen from './screens/ProgressHubScreen';
import MemoryAssessmentScreen from './screens/MemoryAssessmentScreen';
import InstructionAssessmentScreen from './screens/InstructionAssessmentScreen';
import ActionsScreen from './screens/ActionsScreen';

// Learning modules
import PhotoSpellingModule from './modules/PhotoSpellingModule';
import WritingMathModule from './modules/WritingMathModule';
import MultiSkillModule from './modules/MultiSkillModule';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabBarStyles = {
  height: 70,
  paddingBottom: 12,
  paddingTop: 8,
  backgroundColor: '#FFFFFF',
  borderTopColor: '#E5E7EB',
  borderTopWidth: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 10,
};

const getTabIcon = (routeName) => {
  switch (routeName) {
    case 'MainHome':
      return Home;
    case 'PhotoSpellingModule':
      return Camera;
    case 'WritingMathModule':
      return PenTool;
    case 'MultiSkillModule':
      return Gamepad2;
    case 'Settings':
      return Settings;
    case 'Actions':
      return Zap;
    default:
      return Home;
  }
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.purple,
      tabBarInactiveTintColor: '#94A3B8',
      tabBarStyle: tabBarStyles,
      tabBarLabelStyle: { fontSize: 11, fontFamily: 'OpenDyslexic-Bold' },
      tabBarIcon: ({ color }) => {
        const Icon = getTabIcon(route.name);
        return <Icon size={22} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="MainHome"
      component={MainHomeScreen}
      options={{ title: 'Home' }}
    />
    <Tab.Screen
      name="PhotoSpellingModule"
      component={PhotoSpellingModule}
      options={{ title: 'Photo' }}
    />
    <Tab.Screen
      name="WritingMathModule"
      component={WritingMathModule}
      options={{ title: 'Write' }}
    />
    <Tab.Screen
      name="MultiSkillModule"
      component={MultiSkillModule}
      options={{ title: 'Games' }}
    />
    <Tab.Screen
      name="Actions"
      component={ActionsScreen}
      options={{ title: 'Actions' }}
    />
    <Tab.Screen
      name="Settings"
      component={UnifiedSettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Tab.Navigator>
);

export default function App() {
  // Load all OpenDyslexic font variants
  const [fontsLoaded] = useFonts({
    'OpenDyslexic-Regular': require('./assets/fonts/OpenDyslexic-Regular.ttf'),
    'OpenDyslexic-Bold': require('./assets/fonts/OpenDyslexic-Bold.ttf'),
    'OpenDyslexic-Italic': require('./assets/fonts/OpenDyslexic-Italic.ttf'),
    'OpenDyslexic-BoldItalic': require('./assets/fonts/OpenDyslexic-BoldItalic.ttf'),
  });

  const [checkingWelcome, setCheckingWelcome] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // Check AsyncStorage flag to determine if welcome screen should show
  useEffect(() => {
    WelcomeScreen.shouldShow().then((should) => {
      setShowWelcome(should);
      setCheckingWelcome(false);
    });
  }, []);

  if (!fontsLoaded || checkingWelcome) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={styles.loadingText}>Loading DysLearn... 🦉</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={showWelcome ? 'Welcome' : 'MainTabs'}
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {/* First-time welcome */}
          <Stack.Screen
            name="Welcome"
            options={{ animation: 'fade' }}
          >
            {({ navigation }) => (
              <WelcomeScreen
                onDone={() => navigation.replace('MainTabs')}
              />
            )}
          </Stack.Screen>

          {/* Main bottom navigation */}
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />

          {/* Progress hub */}
          <Stack.Screen
            name="ProgressHub"
            component={ProgressHubScreen}
            options={{ headerShown: false }}
          />

          {/* Memory Assessment */}
          <Stack.Screen
            name="MemoryAssessment"
            component={MemoryAssessmentScreen}
            options={{ headerShown: false }}
          />

          {/* Instruction Follow */}
          <Stack.Screen
            name="InstructionFollow"
            component={InstructionAssessmentScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blueGrey,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'OpenDyslexic-Regular',
    color: colors.textSecondary,
  },
});
