/**
 * ================================================================================
 * DRAWING CANVAS COMPONENT
 * ================================================================================
 * 
 * A touch-responsive drawing canvas for handwriting practice.
 * This component is the core of the letter and math practice screens where
 * children draw their answers.
 * 
 * FEATURES:
 * ---------
 * - Touch-based drawing with smooth paths
 * - SVG rendering for crisp lines at any resolution
 * - Base64 image capture for ML prediction
 * - Optional guide lines for letter proportion
 * - Dyslexia-friendly colors (warm peach background)
 * - Clear and reset functionality
 * - **Dedicated hidden capture view** for reliable ML-optimized captures
 * 
 * USAGE:
 * ------
 *   const canvasRef = useRef<DrawingCanvasRef>(null);
 * 
 *   // Clear the canvas
 *   canvasRef.current?.clear();
 * 
 *   // Get all drawn paths (SVG path strings)
 *   const paths = canvasRef.current?.getPaths();
 * 
 *   // Capture as base64 for ML prediction
 *   const base64Image = await canvasRef.current?.captureAsBase64();
 * 
 * PROPS:
 * ------
 * @prop {number} canvasHeight - Height (and width) of the square canvas
 * @prop {number} strokeWidth - Width of the drawing stroke (default: 14)
 * @prop {boolean} showGuideLines - Show center guide lines (default: true)
 * @prop {function} onStrokeEnd - Callback when a stroke is completed
 * 
 * REF METHODS:
 * ------------
 * - getPaths(): string[] - Get all SVG path strings
 * - clear(): void - Clear the canvas
 * - captureAsBase64(): Promise<string> - Capture canvas as base64 PNG
 * 
 * TECHNICAL NOTES:
 * ----------------
 * - Uses PanResponder for touch handling
 * - SVG paths use M (moveTo), Q (quadratic Bézier), and L (lineTo) commands
 * - Uses react-native-view-shot for image capture
 * - Canvas is always square (width = height = canvasHeight)
 * - A separate hidden SVG view is used for ML capture to avoid race conditions
 *   with state-based style switching
 * 
 * Author: Research Team 25-26J-333
 * ================================================================================
 */

import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { Text } from './DyslexicText';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { colors, borderRadius, spacing, fontSizes, fontWeights } from '../theme/colors';
import { captureRef } from 'react-native-view-shot';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * The ML model expects 28x28 input. Strokes should be ~3-4px at that resolution.
 * For a canvas of ~350px, that means capture strokes should be:
 *   3.5 * (canvasSize / 28) ≈ 3.5 * 12.5 ≈ 44px
 * 
 * However, the backend also does stroke width normalization, so we target
 * a slightly thinner stroke to preserve letter structure details.
 * The backend will thicken if needed.
 */
const ML_TARGET_STROKE_AT_28 = 3.0;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the DrawingCanvas component
 */
interface DrawingCanvasProps {
    /** Callback fired when a stroke is completed */
    onStrokeEnd?: (paths: string[]) => void;

    /** Width of the drawing stroke in pixels (default: 14) */
    strokeWidth?: number;

    /** Height of the canvas - also used as width (square canvas) */
    canvasHeight: number;

    /** Whether to show center guide lines for letter proportion */
    showGuideLines?: boolean;
}

/**
 * Ref methods exposed by the DrawingCanvas component
 */
export interface DrawingCanvasRef {
    /** Get all completed SVG path strings */
    getPaths: () => string[];

    /** Clear all drawings from the canvas */
    clear: () => void;

    /** Capture the canvas as a base64 encoded PNG image */
    captureAsBase64: () => Promise<string>;
}

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({
    onStrokeEnd,
    strokeWidth = 14,
    canvasHeight,
    showGuideLines = true,
}, ref) => {
    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================

    // Completed paths (strokes that have been released)
    const [paths, setPaths] = useState<string[]>([]);

    // Current path being drawn (while finger is down)
    const [currentPath, setCurrentPath] = useState<string>('');

    // ========================================================================
    // REFS
    // ========================================================================

    // Reference to the DISPLAY View (what the user sees)
    const canvasViewRef = useRef<View>(null);

    // Reference to the HIDDEN capture View (ML-optimized, always white bg + black strokes)
    const captureViewRef = useRef<View>(null);

    // Refs for paths (used internally to avoid stale closure issues)
    const pathsRef = useRef<string[]>([]);
    const currentPathRef = useRef<string>('');

    // Track previous point for smooth curve generation
    const prevPointRef = useRef<{ x: number; y: number } | null>(null);
    // Track total stroke length to filter accidental taps
    const strokeLengthRef = useRef<number>(0);
    // Count points in current stroke
    const pointCountRef = useRef<number>(0);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    /**
     * Calculate the optimal stroke width for the hidden capture view.
     * The capture view renders at the same size as the display canvas,
     * but we scale the stroke so that after the backend downsamples to 28x28,
     * strokes are ~3px wide (matching EMNIST training data).
     */
    const captureStrokeWidth = Math.max(
        ML_TARGET_STROKE_AT_28 * (canvasHeight / 28),
        strokeWidth * 1.2
    );

    // ========================================================================
    // IMPERATIVE HANDLE (Methods exposed via ref)
    // ========================================================================

    useImperativeHandle(ref, () => ({
        /**
         * Get all completed SVG path strings
         * @returns Array of SVG path data strings
         */
        getPaths: () => pathsRef.current,

        /**
         * Clear all drawings from the canvas
         */
        clear: () => {
            pathsRef.current = [];
            currentPathRef.current = '';
            setPaths([]);
            setCurrentPath('');
        },

        /**
         * Capture the canvas as a base64 PNG image.
         * 
         * Uses a DEDICATED HIDDEN VIEW that always renders with ML-optimal settings:
         * - Pure white background (#FFFFFF)
         * - Pure black strokes (#000000)
         * - No guide lines
         * - No rounded corners
         * - Optimized stroke width for ML recognition
         * 
         * This eliminates the race condition of the previous approach where
         * we toggled hideForCapture state and hoped the re-render completed
         * before captureRef fired.
         * 
         * @returns Promise resolving to base64 data URL
         */
        captureAsBase64: async () => {
            try {
                if (!captureViewRef.current) {
                    throw new Error('Capture view ref not available');
                }

                // Small delay to ensure the hidden view has rendered the latest paths
                await new Promise(resolve => setTimeout(resolve, 50));

                // Capture the hidden ML-optimized view
                const base64 = await captureRef(captureViewRef, {
                    format: 'png',
                    quality: 1,
                    result: 'base64',
                });

                // Return as data URL for the API
                return `data:image/png;base64,${base64}`;
            } catch (error) {
                console.error('Failed to capture canvas:', error);
                throw error;
            }
        }
    }));

    // ========================================================================
    // TOUCH HANDLING (PanResponder)
    // ========================================================================

    const panResponder = useRef(
        PanResponder.create({
            // Always capture touch events
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            /**
             * Touch started - begin a new path
             */
            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const x = locationX.toFixed(1);
                const y = locationY.toFixed(1);
                // SVG path: M = moveTo (starting point)
                const newPath = `M${x},${y}`;
                currentPathRef.current = newPath;
                prevPointRef.current = { x: locationX, y: locationY };
                strokeLengthRef.current = 0;
                pointCountRef.current = 1;
                setCurrentPath(newPath);
            },

            /**
             * Touch moved - add points using quadratic Bézier curves for smooth strokes.
             * Interpolates intermediate points when the finger moves fast to avoid gaps.
             */
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const prev = prevPointRef.current;
                if (!prev) return;

                const dx = locationX - prev.x;
                const dy = locationY - prev.y;
                const dist = Math.hypot(dx, dy);

                // Skip tiny jitter (less than 1px movement)
                if (dist < 1) return;

                // Accumulate total stroke length
                strokeLengthRef.current += dist;
                pointCountRef.current += 1;

                // Use quadratic Bézier: control point is the previous point,
                // end point is midpoint between previous and current.
                // This produces smooth curves through all touch points.
                const midX = ((prev.x + locationX) / 2).toFixed(1);
                const midY = ((prev.y + locationY) / 2).toFixed(1);
                const cpX = prev.x.toFixed(1);
                const cpY = prev.y.toFixed(1);

                const curve = `Q${cpX},${cpY} ${midX},${midY}`;
                currentPathRef.current += curve;
                prevPointRef.current = { x: locationX, y: locationY };
                setCurrentPath(currentPathRef.current);
            },

            /**
             * Touch ended - complete the path, filtering accidental taps
             */
            onPanResponderRelease: () => {
                // Close the path to the last actual touch point
                if (prevPointRef.current && pointCountRef.current > 1) {
                    const x = prevPointRef.current.x.toFixed(1);
                    const y = prevPointRef.current.y.toFixed(1);
                    currentPathRef.current += `L${x},${y}`;
                }

                // Filter out accidental taps: require minimum stroke length
                // (roughly 8px — smaller than any intentional letter stroke)
                const MIN_STROKE_LENGTH = 8;
                if (currentPathRef.current && strokeLengthRef.current >= MIN_STROKE_LENGTH) {
                    pathsRef.current.push(currentPathRef.current);
                    const updatedPaths = [...pathsRef.current];
                    setPaths(updatedPaths);

                    // Notify parent component
                    if (onStrokeEnd) {
                        onStrokeEnd(updatedPaths);
                    }
                }

                // Reset current path
                setCurrentPath('');
                currentPathRef.current = '';
                prevPointRef.current = null;
                strokeLengthRef.current = 0;
                pointCountRef.current = 0;
            },
        })
    ).current;

    // ========================================================================
    // RENDER
    // ========================================================================

    // Check if canvas has any drawing
    const hasDrawing = paths.length > 0 || currentPath.length > 0;

    return (
        <View style={{ width: canvasHeight, height: canvasHeight }}>
            {/* ============================================================ */}
            {/* DISPLAY VIEW - What the user sees and interacts with */}
            {/* ============================================================ */}
            <View style={[styles.outerFrame, { width: canvasHeight, height: canvasHeight }]}>
                <View
                    ref={canvasViewRef}
                    style={styles.canvasContainer}
                    {...panResponder.panHandlers}
                    collapsable={false}
                >
                    {/* SVG layer for drawing */}
                    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                        {/* Dyslexia-friendly warm peach background */}
                        <Rect x="0" y="0" width="100%" height="100%"
                            fill={colors.peachLight} />

                        {/* Guide lines - help with letter proportion */}
                        {showGuideLines && (
                            <>
                                {/* Horizontal center line */}
                                <Line
                                    x1="0" y1="50%" x2="100%" y2="50%"
                                    stroke={colors.grey} strokeWidth="1.5" strokeDasharray="8,8"
                                />
                                {/* Vertical center line */}
                                <Line
                                    x1="50%" y1="0" x2="50%" y2="100%"
                                    stroke={colors.grey} strokeWidth="1.5" strokeDasharray="8,8"
                                />
                            </>
                        )}

                        {/* Completed paths - display style */}
                        {paths.map((d, index) => (
                            <Path
                                key={index}
                                d={d}
                                stroke={colors.stroke}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ))}

                        {/* Current path being drawn */}
                        {currentPath && (
                            <Path
                                d={currentPath}
                                stroke={colors.stroke}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}
                    </Svg>

                    {/* Placeholder shown when canvas is empty */}
                    {!hasDrawing && (
                        <View style={styles.placeholderContainer}>
                            <Text style={styles.placeholderEmoji}>✏️</Text>
                            <Text style={styles.placeholderText}>Draw here</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* ============================================================ */}
            {/* HIDDEN CAPTURE VIEW - ML-optimized, never visible to user */}
            {/* ============================================================ */}
            {/* This view always renders with optimal settings for ML:       */}
            {/* - Pure white background for clean polarity detection         */}
            {/* - Pure black strokes for maximum contrast                    */}
            {/* - No guide lines that could confuse the model               */}
            {/* - No rounded corners that could clip letter edges            */}
            {/* - Optimized stroke width for EMNIST-compatible recognition   */}
            {/* - Round line caps for natural stroke appearance              */}
            {/* ============================================================ */}
            <View
                ref={captureViewRef}
                style={[
                    styles.hiddenCaptureView,
                    { width: canvasHeight, height: canvasHeight }
                ]}
                collapsable={false}
                pointerEvents="none"
            >
                <Svg
                    width={canvasHeight}
                    height={canvasHeight}
                    viewBox={`0 0 ${canvasHeight} ${canvasHeight}`}
                >
                    {/* Pure white background */}
                    <Rect x="0" y="0" width={canvasHeight} height={canvasHeight}
                        fill="#FFFFFF" />

                    {/* Completed paths - ML-optimized style */}
                    {paths.map((d, index) => (
                        <Path
                            key={`cap-${index}`}
                            d={d}
                            stroke="#000000"
                            strokeWidth={captureStrokeWidth}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}

                    {/* Current path (included in case capture happens mid-stroke) */}
                    {currentPath && (
                        <Path
                            d={currentPath}
                            stroke="#000000"
                            strokeWidth={captureStrokeWidth}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}
                </Svg>
            </View>
        </View>
    );
});

DrawingCanvas.displayName = 'DrawingCanvas';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    /**
     * Outer frame with colored border
     * Creates a visible boundary and adds visual appeal
     */
    outerFrame: {
        borderRadius: borderRadius.xl,
        padding: 4,
        backgroundColor: colors.blue,  // Dyslexia-friendly blue border
        shadowColor: colors.blue,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },

    /**
     * Main canvas container (display)
     * This is where the drawing happens
     */
    canvasContainer: {
        flex: 1,
        backgroundColor: colors.peachLight,  // Warm peach - easy on dyslexic eyes
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },

    /**
     * Hidden capture view for ML-optimized image capture.
     * Positioned off-screen so it's never visible but still renders.
     * react-native-view-shot's captureRef renders the view to an image
     * buffer regardless of screen position, so off-screen works fine.
     * No rounded corners, no border, pure white background.
     */
    hiddenCaptureView: {
        position: 'absolute',
        top: -5000,
        left: -5000,
        backgroundColor: '#FFFFFF',
        // No borderRadius — prevents corner clipping of letter strokes
        // No overflow: 'hidden' — ensures full stroke rendering
    },

    /**
     * Placeholder container (shown when empty)
     */
    placeholderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',  // Don't block touch events
    },

    /**
     * Placeholder emoji (pencil icon)
     */
    placeholderEmoji: {
        fontSize: 40,
        marginBottom: spacing.xs,
        opacity: 0.5,
    },

    /**
     * Placeholder text
     */
    placeholderText: {
        fontSize: fontSizes.body,
        color: colors.grey,
        fontWeight: fontWeights.semiBold,
    },
});
