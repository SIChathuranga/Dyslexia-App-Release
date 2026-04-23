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
    const canvasRef = useRef(null);
    const viewShotRef = useRef(null);
    // Server IP - update this to your computer's IP address
    const [serverIp, setServerIp] = useState(getApiHost());
    const [status, setStatus] = useState('Ready to connect.');
    const [prediction, setPrediction] = useState(null);
    const [confidence, setConfidence] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    // Test connection on mount and when IP changes
    useEffect(() => {
        testConnection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverIp]);
    const testConnection = async () => {
        try {
            const response = await fetch(`http://${serverIp}:5000/health`, {
                method: 'GET',
            });
            if (response.ok) {
                // Also verify model mode to avoid fake-success in mock mode
                try {
                    const infoResponse = await fetch(`http://${serverIp}:5000/api/letter/info`, {
                        method: 'GET',
                    });
                    if (infoResponse.ok) {
                        const infoJson = await infoResponse.json();
                        const mode = infoJson?.data?.mode;
                        if (mode === 'mock') {
                            setIsConnected(false);
                            setStatus('Backend is in MOCK mode. Use Python 3.11/3.12 for real inference.');
                            return;
                        }
                    }
                }
                catch {
                    // Keep health-based status if info endpoint fails
                }
                setIsConnected(true);
                setStatus('Connected to server (real inference)');
            }
            else {
                setIsConnected(false);
                setStatus('Server not responding');
            }
        }
        catch {
            setIsConnected(false);
            setStatus('Cannot reach server');
        }
    };
    const handlePredict = async () => {
        if (!viewShotRef.current?.capture)
            return;
        try {
            setIsLoading(true);
            setPrediction(null);
            setConfidence(null);
            // Block prediction when backend runs in mock mode
            const infoResponse = await fetch(`http://${serverIp}:5000/api/letter/info`, {
                method: 'GET',
            });
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
            // Convert captured image to base64
            const base64Img = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64'
            });
            const dataUri = `data:image/jpeg;base64,${base64Img}`;
            setStatus(`Sending to ${serverIp}...`);
            // Send to Python Backend (using the new API endpoint structure)
            const response = await fetch(`http://${serverIp}:5000/api/letter/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            }
            else {
                throw new Error(result.error || 'Unknown error');
            }
        }
        catch (err) {
            console.error(err);
            setStatus(`Error: ${err.message}`);
            Alert.alert("Connection Failed", "Make sure the Python server is running:\n\ncd backend\npython run.py");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleClear = () => {
        canvasRef.current?.clear();
        setPrediction(null);
        setConfidence(null);
        setStatus('Canvas Cleared.');
    };
    return (<SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.header}>
                <Text style={styles.title}>Letter Recognition (Server)</Text>
                <Text style={styles.subtitle}>Draw a letter below</Text>
            </View>

            <View style={styles.ipContainer}>
                <Text style={styles.label}>Server IP:</Text>
                <TextInput style={styles.input} value={serverIp} onChangeText={setServerIp} placeholder="e.g. 192.168.1.10" keyboardType="default"/>
                <View style={[
            styles.connectionDot,
            { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
        ]}/>
            </View>

            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{status}</Text>
            </View>

            {/* Wrap Canvas in ViewShot to capture it as an image */}
            <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={styles.canvasContainer}>
                <DrawingCanvas ref={canvasRef} canvasHeight={300}/>
            </ViewShot>

            <View style={styles.resultContainer}>
                {prediction && (<View style={styles.resultBox}>
                        <Text style={styles.predictionTitle}>Prediction</Text>
                        <Text style={styles.predictionText}>{prediction}</Text>
                        <Text style={styles.confidenceText}>
                            Confidence: {confidence ? (confidence * 100).toFixed(1) : 0}%
                        </Text>
                    </View>)}
            </View>

            <View style={styles.controls}>
                <View style={styles.buttonRow}>
                    <PrimaryButton title={isLoading ? "Processing..." : "Predict"} onPress={handlePredict} style={styles.predictButton} color={colors.accent} disabled={isLoading}/>
                    {isLoading && (<ActivityIndicator size="small" color={colors.primary} style={styles.loader}/>)}
                    <View style={{ width: 20 }}/>
                    <PrimaryButton title="Clear" onPress={handleClear} style={styles.clearButton} color={colors.neutral}/>
                </View>
            </View>
        </SafeAreaView>);
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
    },
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
    input: {
        width: 150,
        height: 40,
        fontSize: fontSizes.body,
        fontFamily: fonts.regular,
        color: colors.text,
    },
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
    canvasContainer: {
        width: 300,
        height: 300,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: colors.primary,
        borderRadius: 10,
        overflow: 'hidden',
    },
    resultContainer: {
        height: 100,
        justifyContent: 'center',
        marginVertical: 10,
    },
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
    loader: {
        position: 'absolute',
        left: 50,
    }
});
