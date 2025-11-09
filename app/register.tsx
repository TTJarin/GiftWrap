import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import ScaledButton from './components/ScaledButton';
import ScaledText from './components/ScaledText';
import { scale, scaleFont, verticalScale } from './scale';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 

  const handleRegister = async () => {
    if (!name || !phoneNumber || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        phoneNumber,
        role: 'user',
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Account created! Please verify your email before logging in.');
      router.replace('/verify-email');
    } catch (error: any) {
      console.error('Registration error:', error.message);
      Alert.alert('Registration Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#D50000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: scale(24) }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center' }}>
          {/* Title */}
          <ScaledText size={32} style={{ fontWeight: 'bold', color: '#fff', marginBottom: verticalScale(24) }}>
            Create Account
          </ScaledText>

          {/* Name */}
          <TextInput
            style={[styles.input, { width: scale(280), padding: verticalScale(12), marginBottom: verticalScale(16) }]}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#fff"
          />

          {/* Phone */}
          <TextInput
            style={[styles.input, { width: scale(280), padding: verticalScale(12), marginBottom: verticalScale(16) }]}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholderTextColor="#fff"
          />

          {/* Email */}
          <TextInput
            style={[styles.input, { width: scale(280), padding: verticalScale(12), marginBottom: verticalScale(16) }]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#fff"
          />

          {/* Password */}
          <View style={[styles.inputWithIcon, { marginBottom: verticalScale(16) }]}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#fff"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[
                styles.input,
                { width: scale(280), padding: verticalScale(12), paddingRight: scale(44) },
              ]}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeInside}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={scaleFont(20)} color="#fff" />
            </TouchableOpacity>
          </View>

          {/*  Confirm Password */}
          <View style={[styles.inputWithIcon, { marginBottom: verticalScale(16) }]}>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#fff"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              style={[
                styles.input,
                { width: scale(280), padding: verticalScale(12), paddingRight: scale(44) },
              ]}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeInside}
            >
              <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={scaleFont(20)} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <ScaledButton
            title="SIGN UP"
            onPress={handleRegister}
            style={{
              width: scale(200),
              paddingVertical: verticalScale(16),
              borderRadius: scale(30),
              backgroundColor: '#fff0e6',
              alignItems: 'center',
              marginBottom: verticalScale(16),
            }}
            textStyle={{ fontSize: scaleFont(16), fontWeight: 'bold', color: '#e63946' }}
          />

          {/* Login Redirect */}
          <TouchableOpacity onPress={() => router.push('/login')} style={{ marginTop: verticalScale(16) }}>
            <ScaledText size={14} style={{ color: '#fff' }}>
              Already have an account?{' '}
              <ScaledText size={14} style={{ fontWeight: 'bold', textDecorationLine: 'underline', color: '#fff' }}>
                Login
              </ScaledText>
            </ScaledText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#f77878',
    borderRadius: scale(20),
    color: '#fff',
  },
  inputWithIcon: {
    position: 'relative',
  },
  eyeInside: {
    position: 'absolute',
    right: scale(12),
    top: verticalScale(12),
  },
});
