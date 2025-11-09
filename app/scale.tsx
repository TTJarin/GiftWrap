import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

export const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
export const verticalScale = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;
export const scaleFont = (size: number) => {
  const newSize = moderateScale(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
