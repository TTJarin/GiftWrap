import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setErrorMessage('Please verify your email before logging in.');
        await auth.signOut();
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Alert.alert('Error', 'User data not found.');
        return;
      }

      const userData = userSnap.data();
      if (userData.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/homepage');
      }

    } catch (error : any) {
      console.log('Login error:', error.code);

      // ✅ User-friendly error messages
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setErrorMessage('Invalid email or password.');
          break;
        case 'auth/invalid-email':
          setErrorMessage('Please enter a valid email address.');
          break;
        case 'auth/too-many-requests':
          setErrorMessage('Too many attempts. Please try again later.');
          break;
        default:
          setErrorMessage('Login failed. Please enter valid email and password and try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#D50000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Login</Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#fff"
          />

          <View style={styles.inputWithIcon}>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={[styles.input, { paddingRight: 44 }]}
              placeholderTextColor="#fff"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeInside}
            >
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')} style={{ marginTop: 20 }}>
            <Text style={styles.registerText}>
              Don’t have an account? <Text style={styles.registerLink}>Register</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  container: { alignItems: 'center' },
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
    width: 280,
    marginBottom: 16,
  },
  eyeInside: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  button: {
    backgroundColor: '#fff0e6',
    width: 200,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#e63946',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#fff',
    backgroundColor: '#e63946',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  registerText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  registerLink: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
