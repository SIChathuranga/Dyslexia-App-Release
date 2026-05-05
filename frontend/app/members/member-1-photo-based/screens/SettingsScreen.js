// SettingsScreen — lets the user change text size, font style, haptic feedback, and access the parent dashboard
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Type, Smartphone, Users, ChevronRight, LogOut } from 'lucide-react-native';
import { colors, fonts } from '../../../theme';
import BackButton from '../../../components/BackButton';

// Props:
//   hapticEnabled / onToggleHaptic       — vibration on/off toggle
//   textSize / onChangeTextSize           — 'small' | 'medium' | 'large'
//   fontStyle / onChangeFontStyle         — 'opendyslexic' | 'sans-serif'
//   onOpenParentDashboard                 — navigate to Progress screen in parent view
//   currentUser / onLogout                — shown only if user is logged in
const SettingsScreen = ({
    onBack,
    onOpenParentDashboard,
    hapticEnabled = true,
    onToggleHaptic,
    textSize = 'medium',
    fontStyle = 'opendyslexic',
    onChangeTextSize,
    onChangeFontStyle,
    currentUser = null,
    onLogout,
}) => {
    // Scale multiplier applied to font sizes throughout this screen (respects user's text size setting)
    const textScale = {
        small: 0.9,
        medium: 1,
        large: 1.2,
    }[textSize] || 1;

    // Returns a style object with the correct font family and scaled font size
    const getTypography = (weight = 'regular', baseSize = null) => {
        const nextStyle = {};

        if (typeof baseSize === 'number') {
            nextStyle.fontSize = Math.round(baseSize * textScale);
        }

        if (fontStyle === 'opendyslexic') {
            nextStyle.fontFamily = weight === 'bold' ? fonts.bold : fonts.regular;
        } else {
            nextStyle.fontWeight = weight === 'bold' ? '700' : '500';
            nextStyle.letterSpacing = 0;
        }

        return nextStyle;
    };

    return (
        <LinearGradient
            colors={['#DBEAFE', '#EDE9FE', '#FCE7F3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerRow}>
                            <BackButton onPress={onBack} style={styles.backButton} />
                            <View style={styles.headerIcon}>
                                <Settings size={32} color="#7C3AED" />
                            </View>
                            <View style={styles.headerText}>
                                <Text style={[styles.headerTitle, getTypography('bold', 28)]}>Settings</Text>
                                <Text style={[styles.headerSubtitle, getTypography('regular', 16)]}>
                                    Customize your experience
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Account card — only rendered if a user is logged in */}
                    {currentUser && (
                        <View style={styles.accountCard}>
                            <Text style={[styles.accountTitle, getTypography('bold', 14)]}>Logged in account</Text>
                            <Text style={[styles.accountName, getTypography('bold', 18)]}>{currentUser.name || 'Learner'}</Text>
                            <Text style={[styles.accountEmail, getTypography('regular', 13)]}>{currentUser.email}</Text>
                        </View>
                    )}

                    {/* Accessibility section: text size, font style, haptic toggle */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Type size={24} color={colors.purple} />
                            <Text style={[styles.sectionTitle, getTypography('bold', 20)]}>Accessibility</Text>
                        </View>

                        {/* Text size picker — three buttons: Small / Medium / Large */}
                        <View style={styles.option}>
                            <Text style={[styles.optionLabel, getTypography('bold', 18)]}>Text Size</Text>
                            <View style={styles.sizeButtons}>
                                {['small', 'medium', 'large'].map((size) => (
                                    <TouchableOpacity
                                        key={size}
                                        onPress={() => onChangeTextSize?.(size)}
                                        style={[styles.sizeButton, textSize === size && styles.sizeButtonActive]}
                                    >
                                        <Text style={[
                                            styles.sizeButtonText,
                                            getTypography('bold', 14),
                                            textSize === size && styles.sizeButtonTextActive,
                                        ]}>
                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Font style picker — Clean Sans Serif or OpenDyslexic */}
                        <View style={styles.option}>
                            <Text style={[styles.optionLabel, getTypography('bold', 18)]}>Font Style</Text>
                            <View style={styles.fontOptions}>
                                {[
                                    { value: 'sans-serif', label: 'Clean Sans Serif' },
                                    { value: 'opendyslexic', label: 'OpenDyslexic' },
                                ].map((fontOption) => (
                                    <TouchableOpacity
                                        key={fontOption.value}
                                        onPress={() => onChangeFontStyle?.(fontOption.value)}
                                        style={[styles.fontButton, fontStyle === fontOption.value && styles.fontButtonActive]}
                                    >
                                        <Text style={[
                                            styles.fontButtonText,
                                            fontOption.value === 'opendyslexic'
                                                ? { fontFamily: fonts.bold, fontSize: Math.round(16 * textScale) }
                                                : { fontWeight: '700', fontSize: Math.round(16 * textScale), letterSpacing: 0 },
                                            fontStyle === fontOption.value && styles.fontButtonTextActive,
                                        ]}>
                                            {fontOption.label}
                                        </Text>
                                        {fontStyle === fontOption.value && (
                                            <ChevronRight size={24} color="white" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Haptic feedback toggle — controls phone vibration on correct/wrong answers */}
                        <View style={styles.toggleOption}>
                            <View style={styles.toggleLeft}>
                                <Smartphone size={24} color={colors.purple} />
                                <Text style={[styles.toggleLabel, getTypography('bold', 18)]}>Haptic Feedback</Text>
                            </View>
                            <Switch
                                value={hapticEnabled}
                                onValueChange={onToggleHaptic}
                                trackColor={{ false: '#D1D5DB', true: colors.green }}
                                thumbColor="white"
                            />
                        </View>
                    </View>

                    {/* Opens the Progress screen in parent/dashboard view */}
                    <TouchableOpacity style={styles.parentButton} onPress={onOpenParentDashboard}>
                        <View style={styles.parentIcon}>
                            <Users size={24} color="#DB2777" />
                        </View>
                        <Text style={[styles.parentText, getTypography('bold', 18)]}>Parent Dashboard</Text>
                        <ChevronRight size={24} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Logout button — only shown when onLogout prop is provided */}
                    {onLogout && (
                        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                            <LogOut size={20} color="#DC2626" />
                            <Text style={[styles.logoutText, getTypography('bold', 16)]}>Logout</Text>
                        </TouchableOpacity>
                    )}

                    {/* App info card */}
                    <View style={styles.infoCard}>
                        <Text style={[styles.infoText, getTypography('regular', 15)]}>
                            Designed for children with dyslexia 💜
                        </Text>
                        <Text style={[styles.versionText, getTypography('regular', 13)]}>
                            Version 1.0.0
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { padding: 24 },
    header: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 8 },
    headerIcon: {
        backgroundColor: '#EDE9FE',
        padding: 12,
        borderRadius: 16,
        marginRight: 16,
    },
    headerText: { flex: 1 },
    headerTitle: { fontSize: 28, color: '#581C87' },
    headerSubtitle: { fontSize: 16, color: '#7C3AED', marginTop: 2 },
    accountCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    accountTitle: { fontSize: 14, color: '#6B7280' },
    accountName: { marginTop: 6, fontSize: 18, color: '#111827' },
    accountEmail: { marginTop: 2, fontSize: 13, color: '#4B5563' },
    section: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    sectionTitle: { fontSize: 20, color: '#1F2937', marginLeft: 12 },
    option: { marginBottom: 24 },
    optionLabel: { fontSize: 18, color: '#374151', marginBottom: 12 },
    sizeButtons: { flexDirection: 'row' },
    sizeButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#E5E7EB',
        borderRadius: 16,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    sizeButtonActive: { backgroundColor: colors.purple },
    sizeButtonText: { fontSize: 14, color: '#374151' },
    sizeButtonTextActive: { color: 'white' },
    fontOptions: {},
    fontButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#E5E7EB',
        borderRadius: 16,
        marginBottom: 8,
    },
    fontButtonActive: { backgroundColor: colors.purple },
    fontButtonText: { fontSize: 16, color: '#374151' },
    fontButtonTextActive: { color: 'white' },
    toggleOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    toggleLeft: { flexDirection: 'row', alignItems: 'center' },
    toggleLabel: { fontSize: 16, color: '#374151', marginLeft: 12 },
    parentButton: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    parentIcon: {
        backgroundColor: '#FCE7F3',
        padding: 12,
        borderRadius: 16,
        marginRight: 16,
    },
    parentText: { flex: 1, fontSize: 18, color: '#1F2937' },
    logoutButton: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoutText: { marginLeft: 8, fontSize: 16, color: '#B91C1C' },
    infoCard: {
        backgroundColor: '#EDE9FE',
        borderWidth: 4,
        borderColor: '#DDD6FE',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    infoText: { fontSize: 18, color: '#581C87', textAlign: 'center' },
    versionText: { fontSize: 14, color: '#7C3AED', marginTop: 8 },
});

export default SettingsScreen;
