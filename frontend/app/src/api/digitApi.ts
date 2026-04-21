/**
 * API Service for Digit Recognition Backend
 * 
 * This service handles communication with the Python Flask backend
 * for digit (0-9) ML model inference - used for math practice.
 */
import { getApiBaseUrl as getResolvedApiBaseUrl } from './apiBaseUrl';

export interface DigitPredictionResult {
    label: string;
    confidence: number;
    index: number;
    mock?: boolean;
    top_predictions?: { label: string; confidence: number; index: number }[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface DigitModelInfo {
    loaded: boolean;
    mode?: string;
    input_shape?: number[];
    output_shape?: number[];
    num_classes?: number;
    message?: string;
}

/**
 * Get information about the loaded digit model
 */
export const getDigitModelInfo = async (): Promise<DigitModelInfo | null> => {
    try {
        const response = await fetch(`${getResolvedApiBaseUrl()}/api/digit/info`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (response.ok) {
            const result: ApiResponse<DigitModelInfo> = await response.json();
            if (result.success && result.data) {
                return result.data;
            }
        }
        return null;
    } catch (error) {
        console.error('Failed to get digit model info:', error);
        return null;
    }
};

/**
 * Send a base64 encoded image to the backend for digit prediction
 * 
 * @param base64Image - Base64 encoded image string (with or without data URL prefix)
 * @returns Prediction result with label, confidence, and index
 */
export const predictDigitFromImage = async (base64Image: string): Promise<DigitPredictionResult> => {
    try {
        console.log('Sending digit image to backend for prediction...');
        console.log('Image data length:', base64Image.length);

        const response = await fetch(`${getResolvedApiBaseUrl()}/api/digit/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error response:', errorText);
            throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }

        const result: ApiResponse<DigitPredictionResult> = await response.json();

        if (result.success && result.data) {
            console.log('Digit prediction received:', result.data);
            return result.data;
        } else {
            throw new Error(result.error || 'Unknown digit prediction error');
        }
    } catch (error) {
        console.error('Digit Prediction API error:', error);
        throw error;
    }
};

/**
 * Get the current API base URL
 */
export const getDigitApiBaseUrl = (): string => {
    return getResolvedApiBaseUrl();
};
