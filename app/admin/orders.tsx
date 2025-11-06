import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'orders'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(list);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete order');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace('/admin')}>
          <View style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#D50000" />
            <Text style={styles.backText}>Back</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Manage Orders</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#D50000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>Order: {item.orderId || item.id}</Text>
                <Text style={styles.details}>Customer: {item.customerName || 'Unknown'}</Text>
                <Text style={styles.details}>Status: {item.status || 'Pending'}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() =>
                  Alert.alert('Delete Order', `Delete ${item.orderId}?`, [
                    { text: 'Cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) },
                  ])
                }
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>No orders found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#D50000', marginLeft: 5, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#D50000', marginVertical: 20 },
  item: { flexDirection: 'row', backgroundColor: '#f8f8f8', borderRadius: 10, padding: 12, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  details: { fontSize: 14, color: '#666' },
  deleteBtn: { backgroundColor: '#D50000', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  deleteText: { color: 'white', fontWeight: 'bold' },
});
