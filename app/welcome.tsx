import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import ScaledText from './components/ScaledText';
import ScaledButton from './components/ScaledButton';
import { spacing } from './theme';
import { scale, verticalScale, scaleFont } from './scale';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#D50000', justifyContent: 'center', alignItems: 'center', padding: scale(20) }}>
      <ScaledText size={36} style={{ fontWeight: 'bold', color: '#fff', marginBottom: verticalScale(50) }}>
        GiftWrap
      </ScaledText>

      <ScaledButton
        title="Login Account"
        onPress={() => router.push('/login')}
        style={{
          backgroundColor: '#FFF3E0',
          width: '80%',
          paddingVertical: verticalScale(16),
          borderRadius: scale(15),
          marginBottom: verticalScale(20),
          alignItems: 'center',
        }}
        textStyle={{ color: '#D50000', fontWeight: 'bold' }}
      />

      <ScaledButton
        title="Create Account"
        onPress={() => router.push('/register')}
        style={{
          backgroundColor: '#FFF3E0',
          width: '80%',
          paddingVertical: verticalScale(16),
          borderRadius: scale(15),
          marginBottom: verticalScale(20),
          alignItems: 'center',
        }}
        textStyle={{ color: '#D50000', fontWeight: 'bold' }}
      />
    </View>
  );
}
