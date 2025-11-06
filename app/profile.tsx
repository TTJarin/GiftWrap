import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../firebaseConfig';

// --- Define a User interface ---
interface User {
  name: string;
  email: string;
  phone: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); // typed user state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              name: (data.username as string) || (data.name as string) || currentUser.displayName || '',
              email: (data.email as string) || currentUser.email || '',
              phone:
                (data.phone as string) ||
                (data.phoneNumber as string) ||
                (data.mobile as string) ||
                (data.contact as string) ||
                currentUser.phoneNumber ||
                '',
            });
          } else {
            setUser({
              name: currentUser.displayName || '',
              email: currentUser.email || '',
              phone: currentUser.phoneNumber || '',
            });
          }
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleBack = () => router.replace('/homepage');
  const logout = () => router.replace('/welcome');

  const navigateTo = (item: string) => {
    if (item === 'Calendar') router.push('/calendar');
    else router.push('/orders');
  };

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <TouchableOpacity onPress={handleBack} style={styles.backWrapper}>
            <Text style={styles.back}>{'< Back'}</Text>
          </TouchableOpacity>

          <Image source={require('../assets/images/profile-user.png')} style={styles.avatar} />

          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 30 }} />
          ) : user ? (
            <>
              <Text style={styles.name}>{user.name || 'No Name'}</Text>
              <Text style={styles.email}>{user.email || 'No Email'}</Text>
              <Text style={styles.phone}>{user.phone || 'No Phone'}</Text>
            </>
          ) : (
            <Text style={{ color: 'white', marginVertical: 30 }}>No user info found.</Text>
          )}

          {['My Orders', 'Calendar'].map((item: string, index: number) => (
            <TouchableOpacity key={index} style={styles.button} onPress={() => navigateTo(item)}>
              <Text>{item}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={{ color: 'red', fontWeight: 'bold' }}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.push('/homepage')}>
          <Ionicons name="home" size={28} color="#808080" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/cart')}>
          <Ionicons name="cart" size={28} color="#808080" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person" size={28} color="#D50000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Styles remain unchanged ---
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#D50000' },
  safeArea: { flex: 1 },
  scrollContainer: { alignItems: 'center', paddingTop: 60, paddingBottom: 100, paddingHorizontal: 20 },
  avatar: { width: 150, height: 150, borderRadius: 60 },
  backWrapper: { position: 'absolute', top: 30, left: 20 },
  back: { color: 'white', fontSize: 16 },
  name: { color: 'white', fontSize: 22, fontWeight: 'bold', marginTop: 40 },
  email: { color: 'white', fontSize: 16, marginTop: 5 },
  phone: { color: 'white', fontSize: 16, marginBottom: 20 },
  button: { backgroundColor: '#FFF3E0', padding: 12, width: '80%', borderRadius: 10, marginTop: 10, alignItems: 'center' },
  nav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderColor: '#ccc' },
});
