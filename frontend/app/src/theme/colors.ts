// ===========================================
// DYSLEXIA-FRIENDLY COLOR PALETTE
// Based on research by Carol Ann Challoner
// ===========================================

export const colors = {
    // ========== PRIMARY DYSLEXIA COLORS ==========

    // Blue - Primary accent color
    blue: '#96ADFC',
    blueLight: '#B8C8FD',
    blueDark: '#7A94E8',

    // Blue Grey - Subtle backgrounds
    blueGrey: '#DBE1F1',
    blueGreyLight: '#EEF1F8',

    // Green - Success/positive feedback
    green: '#A8F29A',
    greenLight: '#C5F7BB',
    greenDark: '#7AD66A',

    // Peach - Warm backgrounds (excellent for dyslexia)
    peach: '#EDD1B0',
    peachLight: '#F5E4CE',
    peachDark: '#DDB78A',

    // Purple - Accent/highlight
    purple: '#B987DC',
    purpleLight: '#D1AEEA',

    // Red - Soft error/try again (not harsh)
    red: '#E0A6AA',
    redLight: '#F0C8CB',

    // Turquoise - Alternative accent
    turquoise: '#A5F7E1',
    turquoiseLight: '#C5FAF0',

    // Yellow - Highlight/attention
    yellow: '#F8FD89',
    yellowLight: '#FBFEB8',

    // Orange - Warm accent
    orange: '#EDDD6D',
    orangeLight: '#F4EA9E',

    // Grey - Neutral elements
    grey: '#D8D3D6',
    greyLight: '#EDEAEC',
    greyDark: '#A8A3A6',

    // ========== APP SEMANTIC COLORS ==========

    // Backgrounds - Use warm peach/cream tones (reduces visual stress)
    background: '#FDF8F3',         // Warm cream (based on peach)
    backgroundAlt: '#EDD1B0',      // Peach for alternative sections

    // Cards and containers
    cardBackground: '#FFFFFF',
    canvasBackground: '#FFFFFF',

    // Primary UI elements
    primary: '#96ADFC',            // Blue
    primaryLight: '#DBE1F1',       // Blue Grey
    primaryDark: '#7A94E8',

    // Secondary UI elements
    secondary: '#A8F29A',          // Green
    secondaryLight: '#C5F7BB',

    // Accent colors
    accent: '#B987DC',             // Purple
    accentAlt: '#A5F7E1',          // Turquoise

    // Text colors - Avoid pure black (too harsh)
    text: '#4A4A4A',               // Dark grey instead of black
    textLight: '#6B6B6B',
    textOnDark: '#FFFFFF',
    textOnPrimary: '#2D3748',      // Dark blue-grey for text on blue

    // Feedback colors
    success: '#A8F29A',            // Green
    successLight: '#E8F8E4',
    error: '#E0A6AA',              // Soft red
    errorLight: '#F8ECED',
    warning: '#F8FD89',            // Yellow
    warningDark: '#C9A227',
    neutral: '#D8D3D6',            // Grey
    neutralLight: '#EDEAEC',

    // Button colors
    buttonCheck: '#7AD66A',        // Darker green for better contrast
    buttonNext: '#EDDD6D',         // Orange/yellow
    buttonClear: '#D8D3D6',        // Grey
    buttonDisabled: '#EDEAEC',

    // Canvas
    canvasBorder: '#96ADFC',       // Blue border
    stroke: '#4A4A4A',             // Drawing stroke

    // Status indicators
    statusConnected: '#7AD66A',
    statusConnecting: '#EDDD6D',
    statusDisconnected: '#E0A6AA',
};

// ===========================================
// DYSLEXIA-FRIENDLY TYPOGRAPHY
// ===========================================

// Recommended fonts for dyslexia (in order of preference):
// 1. OpenDyslexic - Specifically designed for dyslexia
// 2. Lexie Readable - Another dyslexia-specific font
// 3. Comic Sans MS - Surprisingly effective for dyslexia
// 4. Arial - Clean sans-serif
// 5. Verdana - Wide letter spacing
// 
// For React Native, we'll use system fonts with good readability
// On iOS: San Francisco (default) is quite readable
// On Android: Roboto (default) is quite readable

export const fonts = {
    regular: 'OpenDyslexic-Regular',
    bold: 'OpenDyslexic-Bold',
    italic: 'OpenDyslexic-Italic',
    boldItalic: 'OpenDyslexic-BoldItalic',
};

// Font weights - avoid thin/light weights (harder to read)
export const fontWeights = {
    regular: '500' as const,      // Medium weight minimum
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
};

// Font sizes - larger is better for dyslexia
// Minimum 14px, recommended 16-18px for body text
export const fontSizes = {
    small: 14,          // Minimum readable size
    body: 18,           // Default body text
    large: 22,          // Emphasis
    xlarge: 28,         // Headings
    title: 36,          // Large headings
    huge: 56,           // Hero elements (letters/numbers)
    giant: 72,          // Very prominent display
};

// Line height - increased for better readability
export const lineHeights = {
    tight: 1.2,
    normal: 1.5,        // Recommended for dyslexia
    relaxed: 1.8,
};

// Letter spacing - slightly increased helps dyslexia
export const letterSpacing = {
    normal: 0.5,
    wide: 1,
    wider: 1.5,
};

// ===========================================
// SPACING & LAYOUT
// ===========================================

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

// ===========================================
// DYSLEXIA ACCESSIBILITY NOTES
// ===========================================
//
// Key principles implemented:
// 1. Warm background colors (cream/peach) instead of pure white
// 2. Avoid pure black text - use dark grey (#4A4A4A)
// 3. Soft, muted colors that don't vibrate
// 4. Larger font sizes (minimum 14px)
// 5. Medium to bold font weights
// 6. Increased letter and line spacing
// 7. High contrast where needed but not harsh
// 8. Rounded, friendly shapes
// 9. Clear visual hierarchy
// 10. Consistent, predictable layouts
