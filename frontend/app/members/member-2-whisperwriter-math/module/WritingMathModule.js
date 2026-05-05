/**
 * ================================================================================
 * WRITING & MATH REAL-TIME FEEDBACK MODULE
 * ================================================================================
 *
 * Self-contained navigation module for the Writing & Math learning component.
 * Uses a nested Stack Navigator so this module has its own independent
 * navigation stack inside the main app navigator.
 *
 * SCREENS:
 * --------
 * 1. WritingMathHome  (HomeScreen)           — Activity selection menu
 * 2. LetterPractice   (LetterPracticeScreen) — Draw A-Z letters
 * 3. MathPractice     (MathPracticeScreen)   — Solve math problems by writing digits
 * 4. WordCountPractice (WordCountPracticeScreen) — Count letters in words
 * 5. LetterInWord     (LetterInWordScreen)   — Find letters within number words
 * 6. ProgressDashboard (ProgressDashboardScreen) — Progress analytics for parents
 * 7. TfliteLetter     (TfliteLetterScreen)   — Developer/debug mode (server-direct)
 *
 * BACKEND:
 * --------
 * - Flask backend on Render (Account 2) served via Hugging Face Spaces
 * - Letter recognition: TFLite model trained on EMNIST dataset (A-Z)
 * - Digit recognition: TFLite model trained on MNIST dataset (0-9)
 * - Dyslexia-friendly prediction: considers visually similar letters (W/V, B/D, etc.)
 *
 * NAVIGATION:
 * -----------
 * Entry point: this module is mounted from the main app as a nested navigator.
 * The home screen back button navigates to the parent 'MainHome' screen.
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Writing & Math module screens
import { HomeScreen } from '../screens/HomeScreen';
import { LetterPracticeScreen } from '../screens/LetterPracticeScreen';
import { MathPracticeScreen } from '../screens/MathPracticeScreen';
import { TfliteLetterScreen } from '../screens/TfliteLetterScreen';
import { WordCountPracticeScreen } from '../screens/WordCountPracticeScreen';
import { LetterInWordScreen } from '../screens/LetterInWordScreen';
import { ProgressDashboardScreen } from '../screens/ProgressDashboardScreen';

// Shared app theme
import { colors, fonts } from '../../../theme';
import BackButton from '../../../components/BackButton';

const Stack = createNativeStackNavigator();

const WritingMathModule = () => {
    return (
        <Stack.Navigator
            initialRouteName="WritingMathHome"
            screenOptions={{
                // Dyslexia-friendly header styling shared across all screens
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
                animation: 'slide_from_right', // Consistent slide transition
            }}
        >
            {/* ── Home / Activity Selection ─────────────────────────────── */}
            <Stack.Screen
                name="WritingMathHome"
                component={HomeScreen}
                options={({ navigation }) => ({
                    title: '✏️ Write & Count',
                    headerShown: false, // Home screen has its own custom header
                    headerTitleStyle: {
                        fontFamily: fonts.bold,
                        fontSize: 20,
                        color: colors.textPrimary,
                    },
                    // Back to main app home
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

            {/* ── Letter Practice (A-Z Drawing) ─────────────────────────── */}
            <Stack.Screen
                name="LetterPractice"
                component={LetterPracticeScreen}
                options={{
                    title: '✏️ Letters',
                    headerBackTitle: 'Back',
                }}
            />

            {/* ── Math Practice (Arithmetic + Digit Drawing) ────────────── */}
            <Stack.Screen
                name="MathPractice"
                component={MathPracticeScreen}
                options={{
                    title: '🔢 Math',
                    headerBackTitle: 'Back',
                }}
            />

            {/* ── Word Count Practice (Count Letters in Words) ──────────── */}
            <Stack.Screen
                name="WordCountPractice"
                component={WordCountPracticeScreen}
                options={{
                    title: '📝 Word Count',
                    headerBackTitle: 'Back',
                }}
            />

            {/* ── Letter Hunt (Find Letters in Number Words) ────────────── */}
            <Stack.Screen
                name="LetterInWord"
                component={LetterInWordScreen}
                options={{
                    title: '🔤 Letter Hunt',
                    headerBackTitle: 'Back',
                }}
            />

            {/* ── Progress Dashboard (Analytics for Parents) ───────────── */}
            <Stack.Screen
                name="ProgressDashboard"
                component={ProgressDashboardScreen}
                options={{
                    title: '📊 Progress Dashboard',
                    headerBackTitle: 'Back',
                    headerTitleStyle: {
                        fontFamily: fonts.bold,
                        fontSize: 18,
                        color: colors.text,
                    },
                }}
            />

            {/* ── TFLite Server Mode (Developer Debug Screen) ───────────── */}
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
