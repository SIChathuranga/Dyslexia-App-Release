import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../theme';

const RoundedButton = ({
    children,
    onPress,
    variant = 'primary',
    size = 'medium',
    icon,
    disabled = false,
    style
}) => {
    const variants = {
        primary: [colors.purple, '#9B6BC8'],
        secondary: [colors.blue, '#7A95D8'],
        success: [colors.green, '#8BC97A'],
        gentle: ['#FFB8B8', colors.peach],
    };

    const sizeStyles = {
        medium: { paddingVertical: 16, paddingHorizontal: 32 },
        large: { paddingVertical: 24, paddingHorizontal: 40 },
    };

    const textSizes = {
        medium: 18,
        large: 22,
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
            style={[styles.container, style]}
        >
            <LinearGradient
                colors={variants[variant] || variants.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.gradient,
                    sizeStyles[size],
                    disabled && styles.disabled,
                ]}
            >
                <View style={styles.content}>
                    {icon && <View style={styles.icon}>{icon}</View>}
                    <Text style={[
                        styles.text,
                        { fontSize: textSizes[size] },
                        { fontFamily: fonts.bold }
                    ]}>
                        {children}
                    </Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    gradient: {
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginRight: 12,
    },
    text: {
        color: '#1F2937',
        fontWeight: '700',
    },
    disabled: {
        opacity: 0.5,
    },
});

export default RoundedButton;
