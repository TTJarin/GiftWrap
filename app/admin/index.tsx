import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const router = useRouter();

  const sections = [
    { name: 'Manage Filters', path: '/admin/filters' },
    { name: 'Manage Products', path: '/admin/products' },
    { name: 'Manage Orders', path: '/admin/orders' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      {sections.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.card}
          onPress={() => router.push(item.path as Href)}
        >
          <Text style={styles.cardText}>{item.name}</Text>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#D50000',
    marginBottom: 30,
    marginTop: 20,
  },
  card: {
    backgroundColor: '#D50000',
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
