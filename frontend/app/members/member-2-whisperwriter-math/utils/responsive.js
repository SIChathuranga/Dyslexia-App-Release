/**
 * Responsive Scaling Utility
 *
 * Scales sizes proportionally based on screen dimensions so that
 * layouts designed on a ~375px-wide phone look correct on every
 * device from small phones to large tablets.
 *
 * Usage:
 *   import { scale, verticalScale, moderateScale, wp, hp, SCREEN } from '../utils/responsive';
 *
 *   // Scale a font size
 *   fontSize: moderateScale(18)
 *
 *   // Scale padding
 *   padding: scale(16)
 *
 *   // Percentage of screen width / height
 *   width: wp(80)   // 80% of screen width
 *   height: hp(50)  // 50% of screen height
 */
import { Dimensions, PixelRatio } from 'react-native';
// ============================================================================
// BASE DIMENSIONS (iPhone 14 / standard 375×812 design reference)
// ============================================================================
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
// ============================================================================
// SCREEN DIMENSIONS (reactive on import — recalculate per render if needed)
// ============================================================================
const getScreen = () => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
};
export const SCREEN = getScreen();
// ============================================================================
// SCALING FUNCTIONS
// ============================================================================
/**
 * Horizontal scaling — proportional to screen width.
 * Use for horizontal paddings, margins, widths.
 */
export const scale = (size) => {
    const { width } = getScreen();
    return Math.round((width / BASE_WIDTH) * size);
};
/**
 * Vertical scaling — proportional to screen height.
 * Use for vertical paddings, margins, heights.
 */
export const verticalScale = (size) => {
    const { height } = getScreen();
    return Math.round((height / BASE_HEIGHT) * size);
};
/**
 * Moderate scaling — scales less aggressively than linear.
 * Best for font sizes and icon sizes so they don't get
 * too large on tablets or too small on tiny phones.
 *
 * @param size    Base size in px
 * @param factor  How much to scale (0 = no scale, 1 = full scale). Default 0.5
 */
export const moderateScale = (size, factor = 0.5) => {
    const { width } = getScreen();
    return Math.round(size + (width / BASE_WIDTH - 1) * size * factor);
};
/**
 * Percentage of screen width
 */
export const wp = (percentage) => {
    const { width } = getScreen();
    return Math.round(PixelRatio.roundToNearestPixel((width * percentage) / 100));
};
/**
 * Percentage of screen height
 */
export const hp = (percentage) => {
    const { height } = getScreen();
    return Math.round(PixelRatio.roundToNearestPixel((height * percentage) / 100));
};
/**
 * Responsive font size — uses moderate scaling with a 0.4 factor
 * so text stays readable but doesn't balloon on large screens.
 */
export const fontSize = (size) => moderateScale(size, 0.4);
/**
 * Clamp a scaled value between min and max
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
