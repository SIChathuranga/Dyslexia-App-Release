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
import MemoryAssessmentScreen from './members/member-4-cognitive-assessment/screens/MemoryAssessmentScreen';
import InstructionAssessmentScreen from './members/member-4-cognitive-assessment/screens/InstructionAssessmentScreen';
import ActionsScreen from './members/member-4-cognitive-assessment/screens/ActionsScreen';
import ActionsProgressScreen from './members/member-4-cognitive-assessment/screens/ActionsProgressScreen';
import AssessmentHistoryScreen from './members/member-4-cognitive-assessment/screens/AssessmentHistoryScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import { getAuthSession, isSessionValid } from './services/authSession';
import { setAuthToken } from './members/member-3-adaptive-learning-game/services/multiSkillApi';

// Learning modules
import PhotoSpellingModule from './members/member-1-photo-based/module/PhotoSpellingModule';
import WritingMathModule from './members/member-2-whisperwriter-math/module/WritingMathModule';
import MultiSkillModule from './members/member-3-adaptive-learning-game/module/MultiSkillModule';

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
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Check for existing session and welcome status
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check welcome screen status
        const shouldShowWelcome = await WelcomeScreen.shouldShow();
        setShowWelcome(shouldShowWelcome);

        // Check authentication session
        const session = await getAuthSession();
        if (session && isSessionValid(session)) {
          setUser(session.user);
          setAuthToken(session.token);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setInitializing(false);
        setCheckingWelcome(false);
      }
    };

    initialize();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    setUser(null);
    setAuthToken(null);
  };

  const MainTabs = ({ user }) => (
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
        options={{ title: 'Home' }}
      >
        {(props) => <MainHomeScreen {...props} user={user} />}
      </Tab.Screen>
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
        options={{ title: 'Settings' }}
      >
        {(props) => <UnifiedSettingsScreen {...props} onLogout={handleLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );

  if (!fontsLoaded || checkingWelcome || initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.purple} />
        <Text style={styles.loadingText}>Loading DysLearn... 🦉</Text>
      </View>
    );
  }

  const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="SignIn">
        {(props) => <SignInScreen {...props} onLoginSuccess={handleLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {(props) => <SignUpScreen {...props} onLoginSuccess={handleLoginSuccess} />}
      </Stack.Screen>
    </Stack.Navigator>
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={showWelcome ? 'Welcome' : (user ? 'MainTabs' : 'Auth')}
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
                onDone={() => navigation.replace(user ? 'MainTabs' : 'Auth')}
              />
            )}
          </Stack.Screen>


          {/* Main Content Stack */}
          {user ? (
            <>
              <Stack.Screen
                name="MainTabs"
                options={{ headerShown: false }}
              >
                {(props) => <MainTabs {...props} user={user} />}
              </Stack.Screen>
              <Stack.Screen
                name="ProgressHub"
                component={ProgressHubScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MemoryAssessment"
                component={MemoryAssessmentScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="InstructionFollow"
                component={InstructionAssessmentScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ActionsProgress"
                component={ActionsProgressScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AssessmentHistory"
                component={AssessmentHistoryScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <Stack.Screen
              name="Auth"
              component={AuthStack}
            />
          )}
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
