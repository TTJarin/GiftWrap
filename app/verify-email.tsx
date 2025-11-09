import { useRouter } from 'expo-router';
import { sendEmailVerification } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebaseConfig';
import ScaledButton from './components/ScaledButton';
import ScaledText from './components/ScaledText';
import { scale, scaleFont, verticalScale } from './scale';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);

  const resendEmail = async () => {
    setIsSending(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Alert.alert('Verification email sent', 'Please check your inbox.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setIsSending(false);
  };

  const checkVerificationStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        Alert.alert('Success', 'Email verified! You can now log in.');
        router.replace('/login');
      } else {
        Alert.alert('Not verified yet', 'Please click the verification link sent to your email.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScaledText size={28} style={{ fontWeight: 'bold', color: '#fff', marginBottom: verticalScale(16), textAlign: 'center' }}>
        Verify Your Email
      </ScaledText>

      <ScaledText size={16} style={{ color: '#fff', textAlign: 'center', marginBottom: verticalScale(30) }}>
        A verification email has been sent to your email address. Please click the link to verify your account.
      </ScaledText>

      <ScaledButton
        title={isSending ? 'Sending...' : 'Resend Verification Email'}
        onPress={resendEmail}
        style={{
          backgroundColor: '#fff0e6',
          width: scale(250),
          paddingVertical: verticalScale(14),
          borderRadius: scale(30),
          alignItems: 'center',
          marginBottom: verticalScale(16),
          opacity: isSending ? 0.7 : 1,
        }}
        textStyle={{ color: '#e63946', fontWeight: 'bold', fontSize: scaleFont(16), textAlign: 'center' }}
      />

      <ScaledButton
        title="Check Verification Status"
        onPress={checkVerificationStatus}
        style={{
          backgroundColor: '#fff0e6',
          width: scale(250),
          paddingVertical: verticalScale(14),
          borderRadius: scale(30),
          alignItems: 'center',
          marginBottom: verticalScale(16),
        }}
        textStyle={{ color: '#e63946', fontWeight: 'bold', fontSize: scaleFont(16), textAlign: 'center' }}
      />

      <TouchableOpacity
        onPress={() => {
          auth.signOut();
          router.replace('/login');
        }}
        style={{ marginTop: verticalScale(10) }}
      >
        <ScaledText size={16} style={{ color: '#fff', fontWeight: 'bold', textDecorationLine: 'underline', textAlign: 'center' }}>
          Back to Login
        </ScaledText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
    backgroundColor: '#D50000', 
  },
});
