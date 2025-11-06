import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user && user.emailVerified) {
        router.replace('/homepage'); // Redirect to home
      } else {
        router.replace('/welcome'); // Redirect to welcome
      }
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#D50000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D50000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
