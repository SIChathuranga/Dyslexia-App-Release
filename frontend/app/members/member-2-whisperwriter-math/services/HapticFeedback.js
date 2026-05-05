/**
 * ================================================================================
 * HAPTIC FEEDBACK SERVICE
 * ================================================================================
 *
 * Provides standardized haptic (vibration) feedback patterns for the DysLearn app.
 * Uses `expo-haptics` which provides high-quality, native feeling haptic feedback
 * on both iOS (Taptic Engine) and Android.
 *
 * PATTERNS:
 * ---------
 * - SUCCESS: A crisp, pleasant double notification beep (positive reinforcement)
 * - FAILURE: A noticeable but gentle error notification buzz (negative feedback)
 * - NEUTRAL: A light impact tap (acknowledgement, e.g. button press)
 *
 * DESIGN RATIONALE:
 * -----------------
 * Native haptics feel much better and more professional than raw buzzing.
 * They integrate perfectly with accessibility guidelines without being overwhelming
 * or alarming to dyslexic children.
 *
 * Author: Research Team 25-26J-333
 * ================================================================================
 */
import * as Haptics from 'expo-haptics';
/**
 * Trigger a SUCCESS haptic pattern.
 *
 * Call this when the child answers correctly.
 * Provides a crisp, satisfying "success" notification feeling.
 */
export const hapticSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((error) => {
        console.debug('[HapticFeedback] Success haptic failed:', error);
    });
};
/**
 * Trigger a FAILURE haptic pattern.
 *
 * Call this when the child answers incorrectly.
 * Provides a gentle "error" notification feeling.
 * Distinct from success but NOT punishing.
 */
export const hapticFailure = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch((error) => {
        console.debug('[HapticFeedback] Failure haptic failed:', error);
    });
};
/**
 * Trigger a NEUTRAL haptic pattern.
 *
 * Call this for general UI acknowledgement (button taps, navigation, etc.)
 * Provides a single light impact tap.
 */
export const hapticNeutral = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((error) => {
        console.debug('[HapticFeedback] Neutral haptic failed:', error);
    });
};
/**
 * Cancel any ongoing vibration.
 * Note: expo-haptics plays native system length haptics, so a manual cancel
 * is not required or explicitly supported the way raw Vibration is.
 */
export const hapticCancel = () => {
    // Left empty to maintain API compatibility with old Vibration API
};
// Default export as an object for convenience
const HapticFeedback = {
    success: hapticSuccess,
    failure: hapticFailure,
    neutral: hapticNeutral,
    cancel: hapticCancel,
};
export default HapticFeedback;
