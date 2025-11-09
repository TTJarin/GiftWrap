import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { scaleFont } from '../scale';

type Props = TextProps & {
  size?: number;
};

export default function ScaledText({ size = 16, style, ...props }: Props) {
  return <RNText {...props} style={[{ fontSize: scaleFont(size) }, style]} />;
}
