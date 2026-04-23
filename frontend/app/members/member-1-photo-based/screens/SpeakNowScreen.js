import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, Home } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Mascot from '../../../components/ui/Mascot';
import { colors, fonts } from '../../../theme';
import { verifyVoice } from '../../../services/api';

const MIN_RECORDING_MS = 1000; // minimum recording duration to get usable audio

// Low-bitrate recording options — produces small files that upload reliably on Android over HTTP
const RECORDING_OPTIONS = {
    isMeteringEnabled: true,
    android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
    },
    ios: {
        extension: '.m4a',
        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
        audioQuality: Audio.IOSAudioQuality.MEDIUM,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
    },
    web: {
        mimeType: 'audio/webm',
        bitsPerSecond: 128000,
    },
};

const SpeakNowScreen = ({ detectedObject, onComplete, onRetry, onHome }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recording, setRecording] = useState(null);
    const [waveformBars, setWaveformBars] = useState(Array(12).fill(0.3));
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const waveInterval = useRef(null);
    const recordingRef = useRef(null);
    const recordingStartTime = useRef(null);

    // Keep ref in sync with state
    useEffect(() => {
        recordingRef.current = recording;
    }, [recording]);

    // Cleanup active recording if component unmounts prematurely
    useEffect(() => {
        return () => {
            const rec = recordingRef.current;
            if (rec) {
                rec.getStatusAsync()
                    .then((status) => {
                        if (status.isRecording || status.canRecord) {
                            return rec.stopAndUnloadAsync();
                        }
                    })
                    .catch(() => { });
            }
        };
    }, []);

    const { label = 'APPLE', imageUri } = detectedObject || {};

    const startRecording = async () => {
        // Prevent multiple recordings or recording while processing
        if (isRecording || recording || isProcessing) return;

        try {
            // Force-unload any stale recording left from a previous attempt
            if (recordingRef.current) {
                try {
                    await recordingRef.current.stopAndUnloadAsync();
                } catch (_) { /* already unloaded */ }
                recordingRef.current = null;
            }

            await Audio.requestPermissionsAsync();

            // Reset audio mode first to fully release any lingering prepared recording
            // (can happen when navigating between screens quickly)
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
            await new Promise(r => setTimeout(r, 100));
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Retry createAsync — the global Audio singleton may not have released yet
            let newRecording;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const result = await Audio.Recording.createAsync(RECORDING_OPTIONS);
                    newRecording = result.recording;
                    break;
                } catch (e) {
                    if (attempt < 2 && e.message?.includes('Only one Recording')) {
                        console.log(`Recording creation retry (${2 - attempt} left)...`);
                        await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
                        await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
                        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true }).catch(() => {});
                    } else {
                        throw e;
                    }
                }
            }

            setRecording(newRecording);
            setIsRecording(true);
            recordingStartTime.current = Date.now();

            Animated.spring(scaleAnim, {
                toValue: 1.15,
                useNativeDriver: true,
            }).start();

            waveInterval.current = setInterval(() => {
                setWaveformBars(prev => prev.map(() => Math.random() * 0.7 + 0.3));
            }, 100);

        } catch (error) {
            console.error('Failed to start recording', error);
            // Reset state so user can retry
            setRecording(null);
            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();

        if (waveInterval.current) {
            clearInterval(waveInterval.current);
            waveInterval.current = null;
        }
        setWaveformBars(Array(12).fill(0.3));

        if (!recording) return;

        // Enforce minimum recording duration — too-short clips produce garbage
        const elapsed = Date.now() - (recordingStartTime.current || 0);
        if (elapsed < MIN_RECORDING_MS) {
            const remaining = MIN_RECORDING_MS - elapsed;
            await new Promise((r) => setTimeout(r, remaining));
        }

        const currentRecording = recording;
        setRecording(null);
        setIsRecording(false);
        setIsProcessing(true);

        try {
            // Check status before stopping — only unload if still active
            const status = await currentRecording.getStatusAsync();
            if (status.isRecording || status.canRecord) {
                await currentRecording.stopAndUnloadAsync();
            }

            // Reset audio mode so the next recording can be created cleanly
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

            const uri = currentRecording.getURI();

            if (!uri) {
                console.error('Recording URI is null — audio was not captured');
                setIsProcessing(false);
                onComplete(false, '');
                return;
            }

            // Verify the audio file exists and has reasonable size before uploading
            try {
                const fileInfo = await FileSystem.getInfoAsync(uri);
                if (!fileInfo.exists || (fileInfo.size != null && fileInfo.size < 500)) {
                    console.error('Audio file missing or too small:', fileInfo);
                    setIsProcessing(false);
                    onComplete(false, '');
                    return;
                }
            } catch (fsErr) {
                console.warn('File check failed (proceeding anyway):', fsErr.message);
            }

            try {
                const result = await verifyVoice(uri, label);
                setIsProcessing(false);
                onComplete(result.isMatch || result.is_match, result.transcribedText || result.transcribed_text);
            } catch (error) {
                console.error('Verification error:', error);
                setIsProcessing(false);
                onComplete(false, '');
            }
        } catch (error) {
            console.error('Failed to stop recording', error);
            try {
                await currentRecording.stopAndUnloadAsync();
            } catch (innerError) {
                // Already unloaded — safe to ignore
            }
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
            setIsProcessing(false);
            onComplete(false, '');
        }
    };

    return (
        <LinearGradient
            colors={['#FEF3C7', '#FFEDD5', '#FFE4E6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Home Button */}
                <TouchableOpacity style={styles.homeButton} onPress={onHome}>
                    <Home size={24} color="#581C87" />
                </TouchableOpacity>

                {/* Object Reference */}
                <View style={styles.referenceCard}>
                    <View style={styles.referenceContent}>
                        {imageUri && (
                            <Image source={{ uri: imageUri }} style={styles.referenceImage} />
                        )}
                        <View>
                            <Text style={[styles.sayThisLabel, { fontFamily: fonts.regular }]}>Say this word:</Text>
                            <Text style={[styles.wordLabel, { fontFamily: fonts.bold }]}>{label}</Text>
                        </View>
                    </View>
                </View>

                {/* Center Content */}
                <View style={styles.centerContent}>
                    <Mascot mood={isRecording ? "excited" : "encouraging"} size="medium" />

                    <Text style={[styles.instructionText, { fontFamily: fonts.bold }]}>
                        {isProcessing ? "Processing..." : isRecording ? "Listening..." : "Hold to Speak"}
                    </Text>

                    <Pressable
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        disabled={isProcessing}
                        style={styles.micPressable}
                    >
                        <Animated.View style={[
                            styles.micContainer,
                            { transform: [{ scale: scaleAnim }] }
                        ]}>
                            <LinearGradient
                                colors={isProcessing ? ['#9CA3AF', '#6B7280'] : isRecording ? ['#EF4444', '#DC2626'] : ['#F87171', '#EC4899']}
                                style={styles.micButton}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="large" color="white" />
                                ) : (
                                    <Mic size={48} color="white" strokeWidth={2.5} />
                                )}
                            </LinearGradient>
                        </Animated.View>
                    </Pressable>

                    <View style={styles.waveformContainer}>
                        {waveformBars.map((height, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.waveformBar,
                                    {
                                        height: isRecording ? height * 60 : 20,
                                        backgroundColor: isRecording ? colors.purple : '#D1D5DB',
                                    }
                                ]}
                            />
                        ))}
                    </View>

                    {isRecording && (
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={[styles.recordingText, { fontFamily: fonts.bold }]}>Recording...</Text>
                        </View>
                    )}
                    {isProcessing && (
                        <View style={styles.recordingIndicator}>
                            <ActivityIndicator size="small" color={colors.purple} style={{ marginRight: 10 }} />
                            <Text style={[styles.recordingText, { fontFamily: fonts.bold }]}>Checking your answer...</Text>
                        </View>
                    )}
                </View>

                {/* Bottom Hint */}
                <View style={styles.hintCard}>
                    <Text style={[styles.hintText, { fontFamily: fonts.regular }]}>
                        Hold the button and say:
                    </Text>
                    <Text style={[styles.hintWord, { fontFamily: fonts.bold }]}>
                        "{label}"
                    </Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, padding: 20 },
    homeButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 12,
        borderRadius: 16,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    referenceCard: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 20,
        padding: 14,
        marginTop: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    referenceContent: { flexDirection: 'row', alignItems: 'center' },
    referenceImage: { width: 60, height: 60, borderRadius: 12, marginRight: 14 },
    sayThisLabel: { fontSize: 12, color: '#6B7280' },
    wordLabel: { fontSize: 22, color: '#581C87' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    instructionText: { fontSize: 24, color: '#1F2937', marginVertical: 20, textAlign: 'center' },
    micPressable: { marginVertical: 20 },
    micContainer: {},
    micButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        marginVertical: 12,
    },
    waveformBar: { width: 6, borderRadius: 3, marginHorizontal: 3 },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 12,
    },
    recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginRight: 10 },
    recordingText: { fontSize: 14, color: '#1F2937' },
    hintCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    hintText: { fontSize: 14, color: '#374151' },
    hintWord: { color: '#7C3AED', fontSize: 18, marginTop: 4 },
});

export default SpeakNowScreen;
