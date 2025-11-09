import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';

export default function AdminDashboard() {
  const router = useRouter();
  const auth = getAuth();

  const sections = [
    { name: 'Manage Filters', path: '/admin/filters' },
    { name: 'Manage Products', path: '/admin/products' },
    { name: 'Manage Orders', path: '/admin/orders' },
    { name: 'Logout', path: '/logout' },
  ];

  const handlePress = async (item: { name: string; path: string }) => {
    if (item.name === 'Logout') {
      try {
        await signOut(auth);
        router.replace('/login');
      } catch (err) {
        console.log('Logout error:', err);
      }
    } else {
      router.push(item.path as Href);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      {sections.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => handlePress(item)}
        >
          <Text style={styles.cardText}>{item.name}</Text>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#D50000',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#D50000',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  cardText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
