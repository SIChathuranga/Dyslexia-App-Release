// Dyslexia-friendly color palette and theme
// Based on research-backed colors that are easier to read for dyslexic users

export const colors = {
    // Primary colors
    blue: '#96ADFC',
    blueGrey: '#DBE1F1',
    purple: '#B987DC',

    // Accent colors
    green: '#A8F29A',
    turquoise: '#A5F7E1',
    peach: '#EDD1B0',
    orange: '#EDDD6D',
    yellow: '#F8FD89',

    // Feedback colors
    success: '#A8F29A',    // Green - correct answers
    error: '#E0A6AA',      // Soft red - incorrect answers
    warning: '#EDDD6D',    // Orange/Yellow - warnings

    // Neutral colors
    grey: '#D8D3D6',
    lightGrey: '#F5F5F5',
    darkGrey: '#4A4A4A',

    // Background colors
    background: '#F8F9FA',
    cardBackground: '#FFFFFF',

    // Text colors
    textPrimary: '#2D0C57',
    textSecondary: '#6B6B6B',
    textLight: '#FFFFFF',
};

export const fonts = {
    regular: 'OpenDyslexic-Regular',
    bold: 'OpenDyslexic-Bold',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    round: 9999,
};

// Common text styles with OpenDyslexic font
export const textStyles = {
    heading1: {
        fontFamily: fonts.bold,
        fontSize: 28,
        color: colors.textPrimary,
    },
    heading2: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.textPrimary,
    },
    heading3: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
    },
    body: {
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.textPrimary,
        lineHeight: 24,
    },
    bodyLarge: {
        fontFamily: fonts.regular,
        fontSize: 18,
        color: colors.textPrimary,
        lineHeight: 28,
    },
    button: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.textLight,
    },
    caption: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
    },
};

export default {
    colors,
    fonts,
    spacing,
    borderRadius,
    textStyles,
};
