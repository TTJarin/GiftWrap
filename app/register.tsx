import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !phoneNumber || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
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
        role: 'user', // default role
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
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>

          {/* Name */}
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#fff"
          />

          {/* Phone */}
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholderTextColor="#fff"
          />

          {/* Email */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#fff"
          />

          {/* Password with eye toggle */}
          <View style={styles.inputWithIcon}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#fff"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { paddingRight: 44 }]}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeInside}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>SIGN UP</Text>
          </TouchableOpacity>

          {/* Login Redirect */}
          <TouchableOpacity onPress={() => router.push('/login')} style={{ marginTop: 16 }}>
            <Text style={{ color: '#fff', fontSize: 14 }}>
              Already have an account? <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline' }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f77878',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    color: '#fff',
    width: 280,
  },
  inputWithIcon: {
    position: 'relative',
    marginBottom: 16,
  },
  eyeInside: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  button: {
    backgroundColor: '#fff0e6',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: 200,
  },
  buttonText: {
    color: '#e63946',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
