import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { scaleFont, verticalScale, scale } from '../scale';

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function ScaledButton({ title, onPress, style, textStyle }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingVertical: verticalScale(12),
          paddingHorizontal: scale(20),
          backgroundColor: '#4A90E2',
          borderRadius: scale(8),
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text style={[{ color: '#fff', fontSize: scaleFont(16) }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
