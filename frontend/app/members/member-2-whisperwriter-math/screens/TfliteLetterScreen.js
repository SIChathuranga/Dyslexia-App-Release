/**
 * ================================================================================
 * TFLITE LETTER SCREEN (Server Mode)
 * ================================================================================
 *
 * A developer/debug screen for testing the letter recognition backend directly.
 * Children are NOT expected to use this screen in normal app usage.
 *
 * PURPOSE:
 * --------
 * This screen allows direct testing of the Python Flask backend that serves
 * the TFLite letter recognition model. It provides:
 * - Manual IP address input (for local dev server discovery)
 * - Raw prediction result with confidence score
 * - Connection status indicator
 *
 * FLOW:
 * -----
 * 1. Screen loads with auto-detected backend IP
 * 2. Connection test runs on mount and when IP changes
 * 3. User draws a letter on the canvas
 * 4. User taps "Predict" to capture and send to backend
 * 5. Backend returns predicted letter and confidence
 * 6. Result is displayed below the canvas
 *
 * NOTES:
 * ------
 * - Mock mode is blocked — only real TFLite inference is shown
 * - Requires Python backend running: `cd backend && python run.py`
 * - For production, use LetterPracticeScreen instead
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import { Text } from '../components/DyslexicText';
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, fonts, fontSizes, fontWeights } from '../theme/colors';
import { getApiHost } from '../api/apiBaseUrl';

export const TfliteLetterScreen = () => {
    // ========================================================================
    // REFS
    // ========================================================================

    /** Reference to the drawing canvas for clearing */
    const canvasRef = useRef(null);

    /** ViewShot ref used to capture the canvas as an image */
    const viewShotRef = useRef(null);

    // ========================================================================
    // STATE
    // ========================================================================

    /** Backend server IP — auto-filled from apiBaseUrl, editable by user */
    const [serverIp, setServerIp] = useState(getApiHost());

    /** Status message shown below IP input */
    const [status, setStatus] = useState('Ready to connect.');

    /** Predicted letter from the ML model */
    const [prediction, setPrediction] = useState(null);

    /** Confidence score (0-1) for the prediction */
    const [confidence, setConfidence] = useState(null);

    /** Whether a prediction is in progress */
    const [isLoading, setIsLoading] = useState(false);

    /** Whether the backend is reachable and in real inference mode */
    const [isConnected, setIsConnected] = useState(false);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    /**
     * Test connection on mount and whenever the server IP changes.
     * Also verifies that the backend is NOT in mock mode.
     */
    useEffect(() => {
        testConnection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverIp]);

    // ========================================================================
    // FUNCTIONS
    // ========================================================================

    /**
     * Check if the Python backend is reachable and running real TFLite inference.
     * Sets isConnected to false if the server is in mock mode (TF not installed).
     */
    const testConnection = async () => {
        try {
            const response = await fetch(`http://${serverIp}:5000/health`, { method: 'GET' });
            if (response.ok) {
                // Also check model mode to avoid accepting mock-mode as "connected"
                try {
                    const infoResponse = await fetch(`http://${serverIp}:5000/api/letter/info`, { method: 'GET' });
                    if (infoResponse.ok) {
                        const infoJson = await infoResponse.json();
                        const mode = infoJson?.data?.mode;
                        if (mode === 'mock') {
                            setIsConnected(false);
                            setStatus('Backend is in MOCK mode. Use Python 3.11/3.12 for real inference.');
                            return;
                        }
                    }
                } catch {
                    // Keep health-based status if info endpoint fails
                }
                setIsConnected(true);
                setStatus('Connected to server (real inference)');
            } else {
                setIsConnected(false);
                setStatus('Server not responding');
            }
        } catch {
            setIsConnected(false);
            setStatus('Cannot reach server');
        }
    };

    /**
     * Capture the canvas as a JPEG image and send to the backend for prediction.
     *
     * Blocks prediction when backend is in mock mode to prevent misleading results.
     */
    const handlePredict = async () => {
        if (!viewShotRef.current?.capture) return;

        try {
            setIsLoading(true);
            setPrediction(null);
            setConfidence(null);

            // Block prediction when backend runs in mock mode
            const infoResponse = await fetch(`http://${serverIp}:5000/api/letter/info`, { method: 'GET' });
            if (infoResponse.ok) {
                const infoJson = await infoResponse.json();
                const mode = infoJson?.data?.mode;
                if (mode === 'mock') {
                    setStatus('Prediction blocked: backend is in MOCK mode (install real TFLite runtime).');
                    setIsConnected(false);
                    return;
                }
            }

            setStatus('Capturing...');
            const uri = await viewShotRef.current.capture();

            // Convert captured screenshot to base64
            const base64Img = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const dataUri = `data:image/jpeg;base64,${base64Img}`;

            setStatus(`Sending to ${serverIp}...`);

            // POST to backend prediction endpoint
            const response = await fetch(`http://${serverIp}:5000/api/letter/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataUri }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server Error: ${errText}`);
            }

            const result = await response.json();
            console.log("API Response:", result);

            if (result.success && result.data) {
                setPrediction(result.data.label);
                setConfidence(result.data.confidence);
                setStatus(`Predicted: ${result.data.label} (${(result.data.confidence * 100).toFixed(1)}%)`);
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (err) {
            console.error(err);
            setStatus(`Error: ${err.message}`);
            Alert.alert(
                "Connection Failed",
                "Make sure the Python server is running:\n\ncd backend\npython run.py"
            );
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Clear the canvas and reset prediction results
     */
    const handleClear = () => {
        canvasRef.current?.clear();
        setPrediction(null);
        setConfidence(null);
        setStatus('Canvas Cleared.');
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Screen title */}
            <View style={styles.header}>
                <Text style={styles.title}>Letter Recognition (Server)</Text>
                <Text style={styles.subtitle}>Draw a letter below</Text>
            </View>

            {/* IP address input + connection indicator */}
            <View style={styles.ipContainer}>
                <Text style={styles.label}>Server IP:</Text>
                <TextInput
                    style={styles.input}
                    value={serverIp}
                    onChangeText={setServerIp}
                    placeholder="e.g. 192.168.1.10"
                    keyboardType="default"
                />
                {/* Green = connected, Red = disconnected */}
                <View style={[
                    styles.connectionDot,
                    { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
                ]} />
            </View>

            {/* Status message (connection state / prediction result) */}
            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{status}</Text>
            </View>

            {/* Canvas wrapped in ViewShot for image capture */}
            <ViewShot
                ref={viewShotRef}
                options={{ format: "jpg", quality: 0.9 }}
                style={styles.canvasContainer}
            >
                <DrawingCanvas ref={canvasRef} canvasHeight={300} />
            </ViewShot>

            {/* Prediction result box (shown after a successful prediction) */}
            <View style={styles.resultContainer}>
                {prediction && (
                    <View style={styles.resultBox}>
                        <Text style={styles.predictionTitle}>Prediction</Text>
                        <Text style={styles.predictionText}>{prediction}</Text>
                        <Text style={styles.confidenceText}>
                            Confidence: {confidence ? (confidence * 100).toFixed(1) : 0}%
                        </Text>
                    </View>
                )}
            </View>

            {/* Action buttons */}
            <View style={styles.controls}>
                <View style={styles.buttonRow}>
                    <PrimaryButton
                        title={isLoading ? "Processing..." : "Predict"}
                        onPress={handlePredict}
                        style={styles.predictButton}
                        color={colors.accent}
                        disabled={isLoading}
                    />
                    {isLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
                    <View style={{ width: 20 }} />
                    <PrimaryButton
                        title="Clear"
                        onPress={handleClear}
                        style={styles.clearButton}
                        color={colors.neutral}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    /** Full screen container */
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
    },
    /** Screen title area */
    header: {
        marginTop: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: fontSizes.xlarge,
        fontWeight: fontWeights.bold,
        color: colors.primary,
    },
    subtitle: {
        fontSize: fontSizes.body,
        color: colors.textLight,
    },
    /** Row containing IP input + dot */
    ipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    label: {
        fontSize: fontSizes.body,
        marginRight: 10,
        color: colors.text,
    },
    /** Editable IP address input field */
    input: {
        width: 150,
        height: 40,
        fontSize: fontSizes.body,
        fontFamily: fonts.regular,
        color: colors.text,
    },
    /** Green/red connection indicator dot */
    connectionDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginLeft: 10,
    },
    statusContainer: {
        marginVertical: 10,
    },
    statusText: {
        fontSize: fontSizes.small,
        color: colors.textLight,
    },
    /** Canvas capture area */
    canvasContainer: {
        width: 300,
        height: 300,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: colors.primary,
        borderRadius: 10,
        overflow: 'hidden',
    },
    /** Fixed height container for the result box */
    resultContainer: {
        height: 100,
        justifyContent: 'center',
        marginVertical: 10,
    },
    /** Prediction result card */
    resultBox: {
        alignItems: 'center',
        padding: 10,
        backgroundColor: colors.primaryLight,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.primary,
        minWidth: 200,
    },
    predictionTitle: {
        fontSize: fontSizes.small,
        color: colors.primary,
        fontWeight: fontWeights.bold,
    },
    /** Large predicted letter display */
    predictionText: {
        fontSize: fontSizes.huge,
        fontWeight: fontWeights.bold,
        color: colors.text,
    },
    confidenceText: {
        fontSize: fontSizes.small,
        color: colors.textLight,
    },
    controls: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
    },
    /** Side-by-side Predict and Clear buttons */
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    predictButton: {
        width: 120,
    },
    clearButton: {
        width: 120,
    },
    /** Loading spinner overlaid on the Predict button */
    loader: {
        position: 'absolute',
        left: 50,
    }
});
