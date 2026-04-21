/**
 * ================================================================================
 * WRITING & MATH REAL-TIME FEEDBACK MODULE
 * ================================================================================
 *
 * Self-contained module wrapping the writing and math feedback component.
 * Uses a nested Stack Navigator for its own internal screen navigation.
 *
 * Backend: Flask on port 5000 (Render Account 2)
 * Features: Letter recognition, digit recognition, dyslexia-friendly prediction
 * ================================================================================
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Member merge screens
import { HomeScreen } from '../src/screens/HomeScreen';
import { LetterPracticeScreen } from '../src/screens/LetterPracticeScreen';
import { MathPracticeScreen } from '../src/screens/MathPracticeScreen';
import { TfliteLetterScreen } from '../src/screens/TfliteLetterScreen';
import { WordCountPracticeScreen } from '../src/screens/WordCountPracticeScreen';
import { LetterInWordScreen } from '../src/screens/LetterInWordScreen';
import { ProgressDashboardScreen } from '../src/screens/ProgressDashboardScreen';

// Shared theme
import { colors, fonts } from '../theme';
import BackButton from '../components/BackButton';

const Stack = createNativeStackNavigator();

const WritingMathModule = () => {
  return (
    <Stack.Navigator
      initialRouteName="WritingMathHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.blueGrey,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontFamily: fonts.bold,
          fontSize: 18,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="WritingMathHome"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: '✏️ Write & Count',
          headerShown: false,
          headerTitleStyle: {
            fontFamily: fonts.bold,
            fontSize: 20,
            color: colors.textPrimary,
          },
          headerLeft: () => (
            <BackButton
              onPress={() => navigation.getParent()?.navigate('MainHome')}
              style={{ marginRight: 8 }}
              iconColor={colors.textPrimary}
              size={22}
            />
          ),
        })}
      />

      <Stack.Screen
        name="LetterPractice"
        component={LetterPracticeScreen}
        options={{
          title: '✏️ Letters',
          headerBackTitle: 'Back',
        }}
      />

      <Stack.Screen
        name="MathPractice"
        component={MathPracticeScreen}
        options={{
          title: '🔢 Math',
          headerBackTitle: 'Back',
        }}
      />

      <Stack.Screen
        name="WordCountPractice"
        component={WordCountPracticeScreen}
        options={{
          title: '📝 Word Count',
          headerBackTitle: 'Back',
        }}
      />

      <Stack.Screen
        name="LetterInWord"
        component={LetterInWordScreen}
        options={{
          title: '🔤 Letter Hunt',
          headerBackTitle: 'Back',
        }}
      />

      <Stack.Screen
        name="ProgressDashboard"
        component={ProgressDashboardScreen}
        options={{
          title: '📊 Progress',
          headerBackTitle: 'Back',
        }}
      />

      <Stack.Screen
        name="TfliteLetter"
        component={TfliteLetterScreen}
        options={{
          title: '🔬 Server Mode',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

export default WritingMathModule;
