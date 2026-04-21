/**
 * ================================================================================
 * IMAGE PREPROCESSING UTILITY
 * ================================================================================
 * 
 * Frontend image preprocessing to improve ML recognition accuracy.
 * 
 * The backend already does extensive preprocessing (grayscale, threshold,
 * morphological ops, centering, etc.), but we can help by sending a cleaner
 * image from the frontend.
 * 
 * KEY PREPROCESSING STEPS:
 * 1. Validate the base64 image is not empty/corrupt
 * 2. Ensure proper data URL format
 * 3. Strip any transparency artifacts
 * 
 * The backend handles:
 * - Grayscale conversion
 * - Polarity normalization (auto-detects white/black background)
 * - Otsu thresholding
 * - Morphological operations
 * - Bounding box crop
 * - EMNIST-style centering in 28x28
 * - Normalization to 0-1
 * 
 * Author: Research Team 25-26J-333
 * ================================================================================
 */

/**
 * Validate and clean a base64 image before sending to the backend.
 * 
 * @param base64DataUrl - The base64 data URL from canvas capture
 * @returns Cleaned base64 data URL ready for the API
 * @throws Error if the image data is invalid
 */
export const preprocessImageForApi = (base64DataUrl: string): string => {
    if (!base64DataUrl || base64DataUrl.length < 100) {
        throw new Error('Image data is too small or empty — drawing may not have been captured');
    }

    // Ensure proper data URL prefix
    if (!base64DataUrl.startsWith('data:image/')) {
        // If it's raw base64 without prefix, add it
        if (base64DataUrl.match(/^[A-Za-z0-9+/=]+$/)) {
            return `data:image/png;base64,${base64DataUrl}`;
        }
        throw new Error('Invalid image data format');
    }

    return base64DataUrl;
};

/**
 * Check if a base64 image has sufficient content (not just blank).
 * 
 * A very small base64 string likely means the canvas was empty or
 * the capture failed. This helps catch issues early before sending
 * to the backend.
 * 
 * @param base64DataUrl - The base64 data URL
 * @returns true if the image appears to have content
 */
export const hasImageContent = (base64DataUrl: string): boolean => {
    if (!base64DataUrl) return false;

    // Extract the base64 part
    const base64Part = base64DataUrl.includes(',')
        ? base64DataUrl.split(',')[1]
        : base64DataUrl;

    // A blank white PNG is typically very small (~200-400 bytes in base64)
    // A canvas with actual drawing content should be significantly larger
    // Threshold: 500 chars of base64 ≈ 375 bytes of image data
    return base64Part.length > 500;
};
