import { scale, verticalScale, scaleFont } from './scale';

export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
};

export const fonts = {
  small: scaleFont(12),
  regular: scaleFont(16),
  large: scaleFont(20),
  xlarge: scaleFont(24),
};

export const sizes = {
  boxWidth: scale(300),
  boxHeight: verticalScale(150),
  buttonHeight: verticalScale(50),
};

export const colors = {
  primary: '#4A90E2',
  secondary: '#50E3C2',
  text: '#333333',
  background: '#FFFFFF',
};
