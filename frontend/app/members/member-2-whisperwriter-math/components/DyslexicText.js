/**
 * ================================================================================
 * DYSLEXIC TEXT COMPONENT
 * ================================================================================
 *
 * A drop-in replacement for React Native's <Text> component that automatically
 * applies the OpenDyslexic font family throughout the app.
 *
 * USAGE:
 * ------
 *   import { Text } from '../components/DyslexicText';
 *
 *   <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Hello!</Text>
 *
 * The component selects the correct OpenDyslexic variant based on style:
 *   - Regular  → OpenDyslexic-Regular
 *   - Bold     → OpenDyslexic-Bold
 *   - Italic   → OpenDyslexic-Italic
 *   - Bold + Italic → OpenDyslexic-BoldItalic
 *
 * WHY THIS IS NEEDED:
 * -------------------
 * React Native does not automatically apply custom font variants when you set
 * `fontWeight: 'bold'` — it tries to use the system bold variant, which falls
 * back to the system font on Android. By mapping style properties to explicit
 * font family names, we ensure OpenDyslexic is always used.
 *
 * fontWeight and fontStyle are stripped from the final style to prevent the
 * platform from attempting to apply system variants on top of the custom font.
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';

export const Text = (props) => {
    // Flatten any nested style arrays into a single object
    const flattenedStyle = StyleSheet.flatten(props.style || {});
    const fontWeight = flattenedStyle.fontWeight;
    const fontStyle = flattenedStyle.fontStyle;

    // Default to the regular OpenDyslexic variant
    let fontFamily = 'OpenDyslexic-Regular';

    // Determine if the style calls for bold or italic treatment
    const isBold = fontWeight === 'bold'
        || fontWeight === '600'
        || fontWeight === '700'
        || fontWeight === '800';
    const isItalic = fontStyle === 'italic';

    // Select the matching OpenDyslexic font family
    if (isBold && isItalic) {
        fontFamily = 'OpenDyslexic-BoldItalic';
    } else if (isBold) {
        fontFamily = 'OpenDyslexic-Bold';
    } else if (isItalic) {
        fontFamily = 'OpenDyslexic-Italic';
    }

    // Strip fontWeight and fontStyle so the platform doesn't try to apply
    // system font variants on top of our custom font family, which causes
    // fallback to system fonts (especially on Android).
    return (
        <RNText
            {...props}
            style={[
                props.style,
                { fontFamily, fontWeight: undefined, fontStyle: undefined },
            ]}
        />
    );
};
