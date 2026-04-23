import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
export const Text = (props) => {
    // Determine the right font family based on style overrides
    const flattenedStyle = StyleSheet.flatten(props.style || {});
    const fontWeight = flattenedStyle.fontWeight;
    const fontStyle = flattenedStyle.fontStyle;
    let fontFamily = 'OpenDyslexic-Regular';
    const isBold = fontWeight === 'bold' || fontWeight === '600' || fontWeight === '700' || fontWeight === '800';
    const isItalic = fontStyle === 'italic';
    if (isBold && isItalic) {
        fontFamily = 'OpenDyslexic-BoldItalic';
    }
    else if (isBold) {
        fontFamily = 'OpenDyslexic-Bold';
    }
    else if (isItalic) {
        fontFamily = 'OpenDyslexic-Italic';
    }
    // Strip fontWeight and fontStyle so the platform doesn't try to apply
    // system font variants on top of our custom font family, which causes
    // fallback to system fonts (especially on Android).
    return (<RNText {...props} style={[
            props.style,
            { fontFamily, fontWeight: undefined, fontStyle: undefined },
        ]}/>);
};
