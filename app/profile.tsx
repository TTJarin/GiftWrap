import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import { scale, scaleFont, verticalScale } from './scale';

interface User {
  name: string;
  email: string;
  phone: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
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

  const logout = () => router.replace('/welcome');

  const navigateTo = (item: string) => {
    if (item === 'Calendar') router.push('/calendar');
    else router.push('/orders');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          {/* Avatar */}
          <Image
            source={require('../assets/images/profile-user.png')}
            style={styles.avatar}
          />

          {/* User Info */}
          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginVertical: verticalScale(30) }} />
          ) : user ? (
            <>
              <Text style={styles.name}>{user.name || 'No Name'}</Text>
              <Text style={styles.email}>{user.email || 'No Email'}</Text>
              <Text style={styles.phone}>{user.phone || 'No Phone'}</Text>
            </>
          ) : (
            <Text style={{ color: 'white', marginVertical: verticalScale(30) }}>No user info found.</Text>
          )}

          {/* Buttons */}
          {['My Orders', 'Calendar'].map((item: string, index: number) => (
            <TouchableOpacity key={index} style={styles.button} onPress={() => navigateTo(item)}>
              <Text style={{ fontSize: scaleFont(16) }}>{item}</Text>
            </TouchableOpacity>
          ))}

          {/* Logout */}
          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={{ color: 'red', fontWeight: 'bold', fontSize: scaleFont(16) }}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.push('/homepage')}>
            <Ionicons name="home" size={scaleFont(28)} color="#808080" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/cart')}>
            <Ionicons name="cart" size={scaleFont(28)} color="#808080" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Ionicons name="person" size={scaleFont(28)} color="#D50000" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D50000',
  },
  wrapper: { flex: 1, backgroundColor: '#D50000' },
  scrollContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: verticalScale(20), 
    paddingBottom: verticalScale(100), 
    paddingHorizontal: scale(20),
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%', 
    marginBottom: verticalScale(20), 
    position: 'relative',
  },
  headerTitle: { 
    color: 'white', 
    fontSize: scaleFont(22), 
    fontWeight: 'bold', 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    textAlign: 'center',
  },
  avatar: { 
    width: scale(150), 
    height: verticalScale(150), 
    borderRadius: scale(75), 
    backgroundColor: 'white',
    padding: scale(10),
  },
  name: { color: 'white', fontSize: scaleFont(22), fontWeight: 'bold', marginTop: verticalScale(20) },
  email: { color: 'white', fontSize: scaleFont(16), marginTop: verticalScale(5) },
  phone: { color: 'white', fontSize: scaleFont(16), marginBottom: verticalScale(20) },
  button: { 
    backgroundColor: '#FFF3E0', 
    padding: verticalScale(12), 
    width: '80%', 
    borderRadius: scale(10), 
    marginTop: verticalScale(10), 
    alignItems: 'center',
  },
  nav: { 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center',
    paddingVertical: verticalScale(12), 
    borderTopWidth: 1, 
    borderColor: '#ccc',
    borderTopLeftRadius: scale(15),
    borderTopRightRadius: scale(15),
    marginBottom: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(20),
  },
});
