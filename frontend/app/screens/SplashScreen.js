import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Mic, Type } from 'lucide-react-native';
import Mascot from '../components/ui/Mascot';
import { colors, fonts } from '../theme';

const SplashScreen = ({ onComplete }) => {
    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(20);

    useEffect(() => {
        // Animate in
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigate after 3 seconds
        const timer = setTimeout(onComplete, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <LinearGradient
            colors={['#E9D8FD', '#FED7E2', '#BEE3F8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <Animated.View style={[
                styles.content,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}>
                <Mascot mood="excited" size="large" />

                <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
                    <Text style={[styles.title, { fontFamily: fonts.bold }]}>
                        Photo Spelling
                    </Text>

                    <Text style={[styles.subtitle, { fontFamily: fonts.regular }]}>
                        Learn to spell with fun!
                    </Text>
                </Animated.View>

                <View style={styles.iconsContainer}>
                    <View style={styles.iconWrapper}>
                        <Camera size={40} color={colors.purple} />
                    </View>
                    <View style={styles.iconWrapper}>
                        <Mic size={40} color="#EC4899" />
                    </View>
                    <View style={styles.iconWrapper}>
                        <Type size={40} color={colors.blue} />
                    </View>
                </View>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#581C87',
        marginTop: 32,
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 20,
        color: '#7C3AED',
        marginBottom: 48,
        textAlign: 'center',
    },
    iconsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    iconWrapper: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 16,
        borderRadius: 24,
        marginHorizontal: 12,
    },
});

export default SplashScreen;
