// CameraScreen — child takes a photo of an object; photo is sent to the AI for object detection
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera as CameraIcon, RotateCcw, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import RoundedButton from '../../../components/ui/RoundedButton';
import { colors, fonts } from '../../../theme';
import { detectObject } from '../../../services/api';
import * as Speech from 'expo-speech';
import { normalizeChallengeLabel } from '../constants/challengeWords';

// Props:
//   onObjectDetected — callback with { imageUri, label, confidence } when AI finds an object
//   onClose          — called when user exits (Back / Exit Challenge)
//   challengeWord    — the specific word the child must find in challenge mode (null in free practice)
//   challengeWords   — full list of today's challenge words (shown as chips)
//   completedWords   — words already done (chips shown as green)
const CameraScreen = ({
    onObjectDetected,
    onClose,
    challengeWord = null,
    challengeWords = [],
    completedWords = [],
}) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [captured, setCaptured] = useState(false);   // true after photo is taken
    const [imageUri, setImageUri] = useState(null);     // local URI of the captured photo
    const [loading, setLoading] = useState(false);      // true while waiting for AI result
    const [challengeMessage, setChallengeMessage] = useState(null); // instruction text shown on camera
    const cameraRef = useRef(null);
    const challengeStep = challengeWords.findIndex((word) => word === challengeWord) + 1;
    const isChallengeMode = Boolean(challengeWord);

    // Request camera permission on mount if not already granted
    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    // Update the on-screen instruction whenever the target word changes
    useEffect(() => {
        if (challengeWord) {
            setChallengeMessage(`Take a photo of ${challengeWord}`);
        } else {
            setChallengeMessage(null);
        }
    }, [challengeWord]);

    // Take a photo at 70% quality and store its URI locally
    const handleCapture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
                setImageUri(photo.uri);
                setCaptured(true);
            } catch (error) {
                console.error('Error taking photo:', error);
            }
        }
    };

    // Send the photo to the backend AI; handle mismatch, success, and errors
    const handleConfirm = async () => {
        setLoading(true);
        try {
            const result = await detectObject(imageUri);
            console.log('Detection Result:', result);

            if (result.label) {
                // In challenge mode: if detected object doesn't match the required word, prompt retry
                if (
                    challengeWord &&
                    normalizeChallengeLabel(result.label) !== normalizeChallengeLabel(challengeWord)
                ) {
                    const mismatchSpeech = `I found ${result.label}. Please find ${challengeWord}.`;
                    Speech.speak(mismatchSpeech, { language: 'en' });
                    setChallengeMessage(`I found ${result.label}. Look for ${challengeWord}.`);
                    handleRetry();
                    return;
                }

                // Object matches — pass result up and navigate to ObjectRecognitionScreen
                Speech.speak(`I found a ${result.label}`, { language: 'en' });
                onObjectDetected({
                    imageUri,
                    label: result.label,
                    confidence: result.confidence,
                });
            } else {
                Speech.speak('No object detected. Please try again.', { language: 'en' });
                handleRetry();
            }
        } catch (error) {
            console.error('Detect Object Error:', error);
            const isTimeout = error.code === 'ECONNABORTED';
            const msg = isTimeout
                ? 'Server is still waking up. Please wait a moment and try again.'
                : 'Something went wrong. Please try again.';
            Speech.speak(msg, { language: 'en' });
            handleRetry();
        } finally {
            setLoading(false);
        }
    };

    // Discard the photo so the child can try again
    const handleRetry = () => {
        setCaptured(false);
        setImageUri(null);
    };

    // Show permission request screen if camera access not yet granted
    if (!permission?.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={[styles.permissionText, { fontFamily: fonts.bold }]}>
                    Camera permission is required
                </Text>
                <RoundedButton onPress={requestPermission} variant="primary">
                    Grant Permission
                </RoundedButton>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Top half: live camera OR the captured photo */}
            <View style={styles.cameraContainer}>
                {!captured ? (
                    <>
                        <CameraView
                            ref={cameraRef}
                            style={styles.camera}
                            facing="back"
                        />

                        {/* Dashed frame helps child centre the object */}
                        <View style={styles.frameOverlay}>
                            <View style={styles.frame}>
                                <Text style={[styles.frameText, { fontFamily: fonts.bold }]}>
                                    Place your object here
                                </Text>
                            </View>
                        </View>

                        {/* Instruction banner — orange in challenge mode, purple in free practice */}
                        <View style={styles.instructionWrapper}>
                            <LinearGradient
                                colors={isChallengeMode ? [colors.orange, '#F59E0B'] : [colors.purple, '#9B6BC8']}
                                style={[styles.instruction, isChallengeMode && styles.challengeInstruction]}
                            >
                                {isChallengeMode ? (
                                    <>
                                        <Text style={[styles.challengeBadge, { fontFamily: fonts.bold }]}>
                                            Today&apos;s Challenge {challengeStep}/{challengeWords.length}
                                        </Text>
                                        <Text style={[styles.challengeInstructionText, { fontFamily: fonts.bold }]}>
                                            {challengeMessage}
                                        </Text>
                                    </>
                                ) : (
                                    <Text style={[styles.instructionText, { fontFamily: fonts.bold }]}>
                                        Try to hold the camera steady
                                    </Text>
                                )}
                            </LinearGradient>
                        </View>
                    </>
                ) : (
                    // Show the captured photo for confirmation
                    <Image source={{ uri: imageUri }} style={styles.capturedImage} />
                )}
            </View>

            {/* Bottom panel: challenge word chips + capture/confirm buttons */}
            <View style={styles.controls}>
                {/* Challenge word chips — yellow = current, green = done, grey = locked */}
                {isChallengeMode && (
                    <View style={styles.challengePanel}>
                        <Text style={[styles.challengePanelTitle, { fontFamily: fonts.bold }]}>
                            Today&apos;s 4 words
                        </Text>
                        <View style={styles.challengeChipRow}>
                            {challengeWords.map((word) => {
                                const isCompleted = completedWords.includes(word);
                                const isActive = word === challengeWord;

                                return (
                                    <View
                                        key={word}
                                        style={[
                                            styles.challengeChip,
                                            isCompleted && styles.challengeChipDone,
                                            isActive && styles.challengeChipActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.challengeChipText,
                                                { fontFamily: fonts.bold },
                                                isCompleted && styles.challengeChipTextDone,
                                            ]}
                                        >
                                            {word}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Before capture: big camera button + back link */}
                {!captured ? (
                    <View style={styles.captureControls}>
                        <TouchableOpacity
                            style={styles.captureButton}
                            onPress={handleCapture}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[colors.purple, '#EC4899']}
                                style={styles.captureButtonGradient}
                            >
                                <CameraIcon size={40} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onClose}>
                            <Text style={[styles.backButton, { fontFamily: fonts.bold }]}>
                                {isChallengeMode ? 'Exit Challenge' : 'Back'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* After capture: confirm (Yes) sends to AI, Try Again discards the photo */
                    <View style={styles.confirmControls}>
                        <Text style={[styles.confirmTitle, { fontFamily: fonts.bold }]}>
                            {isChallengeMode ? `Is this ${challengeWord}?` : 'Is this your object?'}
                        </Text>

                        <View style={styles.buttonRow}>
                            <View style={styles.buttonWrapper}>
                                <RoundedButton
                                    variant="success"
                                    icon={<Check size={24} color="#22543D" />}
                                    onPress={handleConfirm}
                                    disabled={loading}
                                >
                                    {loading ? 'Detecting...' : 'Yes'}
                                </RoundedButton>
                            </View>
                            <View style={styles.buttonWrapper}>
                                <RoundedButton
                                    variant="gentle"
                                    icon={<RotateCcw size={24} color="#702459" />}
                                    onPress={handleRetry}
                                    disabled={loading}
                                >
                                    Try Again
                                </RoundedButton>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#111827',
    },
    permissionText: {
        fontSize: 18,
        color: 'white',
        marginBottom: 24,
        textAlign: 'center',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    capturedImage: {
        flex: 1,
        resizeMode: 'cover',
    },
    frameOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    frame: {
        width: '100%',
        aspectRatio: 1,
        maxWidth: 300,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.5)',
        borderStyle: 'dashed',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    frameText: {
        color: 'white',
        fontSize: 20,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    instructionWrapper: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    instruction: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginHorizontal: 16,
    },
    challengeInstruction: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    challengeBadge: {
        fontSize: 12,
        color: '#7C2D12',
        marginBottom: 4,
    },
    challengeInstructionText: {
        color: '#1F2937',
        fontSize: 16,
        textAlign: 'center',
    },
    instructionText: {
        color: 'white',
        fontSize: 16,
    },
    controls: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    challengePanel: {
        marginBottom: 18,
    },
    challengePanelTitle: {
        fontSize: 15,
        color: '#374151',
        marginBottom: 10,
    },
    challengeChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    challengeChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#E5E7EB',
        marginRight: 8,
        marginBottom: 8,
    },
    challengeChipActive: {
        backgroundColor: '#FDE68A',
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    challengeChipDone: {
        backgroundColor: '#D1FAE5',
        borderWidth: 2,
        borderColor: '#34D399',
    },
    challengeChipText: {
        fontSize: 13,
        color: '#374151',
    },
    challengeChipTextDone: {
        color: '#065F46',
    },
    captureControls: {
        alignItems: 'center',
    },
    captureButton: {
        marginBottom: 16,
    },
    captureButtonGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    backButton: {
        color: colors.purple,
        fontSize: 18,
    },
    confirmControls: {
        alignItems: 'center',
    },
    confirmTitle: {
        fontSize: 24,
        color: '#581C87',
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
    },
    buttonWrapper: {
        flex: 1,
        marginHorizontal: 8,
    },
});

export default CameraScreen;
