import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
            <View style={{ height: verticalScale(200), justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
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
              <Text style={styles.buttonText}>{item}</Text>
            </TouchableOpacity>
          ))}

          {/* Logout */}
          <TouchableOpacity style={styles.button} onPress={logout}>
            <Text style={styles.buttonText}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D50000',
  },
  wrapper: { 
    flex: 1, 
    backgroundColor: '#D50000',
    alignItems: 'center',
  },
  scrollContainer: { 
    alignItems: 'center', 
    justifyContent: 'flex-start',
    width: '100%',
    paddingTop: 10,
    paddingBottom: verticalScale(100), 
    paddingHorizontal: scale(20),
  },
  headerRow: { 
    width: '100%', 
    marginTop: 50,
    marginBottom: verticalScale(30),
    alignItems: 'center',
  },
  headerTitle: { 
    color: 'white', 
    fontSize: scaleFont(24), 
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  avatar: { 
    width: scale(140), 
    height: scale(140), 
    borderRadius: scale(70), 
    backgroundColor: 'white',
    marginVertical: verticalScale(15),
  },
  name: { 
    color: 'white', 
    fontSize: scaleFont(24), 
    fontWeight: 'bold', 
    marginTop: verticalScale(10),
    textAlign: 'center'
  },
  email: { 
    color: 'white', 
    fontSize: scaleFont(16), 
    marginTop: verticalScale(6),
    textAlign: 'center'
  },
  phone: { 
    color: 'white', 
    fontSize: scaleFont(16), 
    marginTop: verticalScale(10),
    marginBottom: verticalScale(15),
    textAlign: 'center'
  },
  button: { 
    backgroundColor: '#FFF3E0', 
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(20),
    width: scale(200), 
    borderRadius: scale(8), 
    marginTop: verticalScale(10), 
    alignItems: 'center',
    minHeight: verticalScale(54),
    alignSelf: 'center'
  },
  buttonText: {
    color: '#D50000',
    fontWeight: 'bold',
    fontSize: scaleFont(16),
    textAlign: 'center'
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
  },
});
