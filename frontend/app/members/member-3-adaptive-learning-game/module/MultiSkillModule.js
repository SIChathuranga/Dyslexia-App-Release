/**
 * ================================================================================
 * MULTI-SKILL LEARNING GAME MODULE
 * ================================================================================
 *
 * Self-contained module wrapping the multi-skill learning game component.
 * Uses a nested Stack Navigator for its own internal screen navigation.
 * Header styled with dyslexia-friendly theme (blueGrey + OpenDyslexic font).
 *
 * Backend: Flask on port 5001 (Render Account 3)
 * Features: Phoneme Pop, Visual Sequence, Sound & Picture Match, Word Builder,
 *           Dyslexia diagnosis prediction & progress tracking
 * ================================================================================
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme';
import BackButton from '../../../components/BackButton';

// Multi-Skill screens
import MultiSkillHomeScreen from '../screens/MultiSkillHomeScreen';
import PhonemePopScreen from '../screens/whisper-writer/PhonemePopScreen';
import VisualSequenceScreen from '../screens/cognitive/VisualSequenceScreen';
import SoundPictureMatchScreen from '../screens/whisper-writer/SoundPictureMatchScreen';
import WordBuilderScreen from '../screens/photo-based/WordBuilderScreen';
import MultiSkillProgressScreen from '../screens/MultiSkillProgressScreen';

const Stack = createNativeStackNavigator();

const MultiSkillModule = () => {
  return (
    <Stack.Navigator
      initialRouteName="MultiSkillHome"
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
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="MultiSkillHome"
        component={MultiSkillHomeScreen}
        options={({ navigation }) => ({
          title: '🎮 Fun Games',
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
        name="PhonemePop"
        component={PhonemePopScreen}
        options={{ title: '🔤 Phoneme Pop', headerBackTitle: 'Back' }}
      />

      <Stack.Screen
        name="VisualSequence"
        component={VisualSequenceScreen}
        options={{ title: '🎨 Visual Sequence', headerBackTitle: 'Back' }}
      />

      <Stack.Screen
        name="SoundMatch"
        component={SoundPictureMatchScreen}
        options={{ title: '🔊 Sound & Picture', headerBackTitle: 'Back' }}
      />

      <Stack.Screen
        name="WordBuilder"
        component={WordBuilderScreen}
        options={{ title: '🔡 Word Builder', headerBackTitle: 'Back' }}
      />

      <Stack.Screen
        name="MultiSkillProgress"
        component={MultiSkillProgressScreen}
        options={{ title: '📊 My Progress', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
};

export default MultiSkillModule;
