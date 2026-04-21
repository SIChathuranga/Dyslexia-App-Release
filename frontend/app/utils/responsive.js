/**
 * Responsive Scaling Utility (JS version)
 *
 * Scales sizes proportionally based on screen dimensions so that
 * layouts designed on a ~375px-wide phone look correct on every device.
 *
 * Usage:
 *   import { scale, verticalScale, moderateScale, wp, hp } from '../utils/responsive';
 */

import { Dimensions, PixelRatio } from 'react-native';

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const getScreen = () => Dimensions.get('window');

export const scale = (size) => {
  const { width } = getScreen();
  return Math.round((width / BASE_WIDTH) * size);
};

export const verticalScale = (size) => {
  const { height } = getScreen();
  return Math.round((height / BASE_HEIGHT) * size);
};

export const moderateScale = (size, factor = 0.5) => {
  const { width } = getScreen();
  return Math.round(size + (width / BASE_WIDTH - 1) * size * factor);
};

export const wp = (percentage) => {
  const { width } = getScreen();
  return Math.round(PixelRatio.roundToNearestPixel((width * percentage) / 100));
};

export const hp = (percentage) => {
  const { height } = getScreen();
  return Math.round(PixelRatio.roundToNearestPixel((height * percentage) / 100));
};

export const fontSize = (size) => moderateScale(size, 0.4);

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
