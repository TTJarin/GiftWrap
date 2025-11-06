import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../firebaseConfig';
import { sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'expo-router';

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
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.text}>
        A verification email has been sent to your email address. Please click the link to verify your account.
      </Text>

      <TouchableOpacity
        style={[styles.button, isSending && { opacity: 0.7 }]}
        onPress={resendEmail}
        disabled={isSending}
      >
        <Text style={styles.buttonText}>
          {isSending ? 'Sending...' : 'Resend Verification Email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={checkVerificationStatus}>
        <Text style={styles.buttonText}>Check Verification Status</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          auth.signOut();
          router.replace('/login');
        }}
        style={styles.linkContainer}
      >
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#D50000', // ✅ Red theme background
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#fff0e6',
    width: 250,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#e63946',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  linkContainer: {
    marginTop: 10,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
