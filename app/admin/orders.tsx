import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'delivered' | 'pending'>('all');

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'orders'));
      const list = snapshot.docs
        .map((doc) => {
          // Deep clone Firestore data for web compatibility
          const data = JSON.parse(JSON.stringify(doc.data()));

          return {
            id: doc.id,
            ...data,
            items: Array.isArray(data.items)
              ? data.items
              : Object.values(data.items || {}),
          };
        })
        .sort(
          (a: any, b: any) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );

      setOrders(list);
      console.log('Fetched orders (web normalized):', list);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Toggle delivered status
  const handleMarkDelivered = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'orders', id), { delivered: !currentStatus });
      fetchOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'delivered') return order.delivered === true;
    if (filter === 'pending') return !order.delivered;
  });

  // Format Firestore timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.replace('/admin')}>
          <View style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#D50000" />
            <Text style={styles.backText}>Back</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.title}>Manage Orders</Text>

        {/* Filter Buttons */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={filter === 'all' ? styles.activeText : styles.filterText}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              filter === 'delivered' && styles.activeFilter,
            ]}
            onPress={() => setFilter('delivered')}
          >
            <Text
              style={
                filter === 'delivered' ? styles.activeText : styles.filterText
              }
            >
              Delivered
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              filter === 'pending' && styles.activeFilter,
            ]}
            onPress={() => setFilter('pending')}
          >
            <Text
              style={
                filter === 'pending' ? styles.activeText : styles.filterText
              }
            >
              Pending
            </Text>
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        {loading ? (
          <ActivityIndicator size="large" color="#D50000" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            style={styles.list}
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                {/* Header */}
                <View style={styles.orderHeader}>
                  <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  <View style={styles.checkboxRow}>
                    <Checkbox
                      value={item.delivered || false}
                      onValueChange={() =>
                        handleMarkDelivered(item.id, item.delivered || false)
                      }
                      color={item.delivered ? '#4CAF50' : undefined} // ✅ green when delivered
                    />
                    <Text
                      style={[
                        { marginLeft: 5 },
                        item.delivered && { color: '#4CAF50', fontWeight: 'bold' },
                      ]}
                    >
                      Delivered
                    </Text>
                  </View>
                </View>

                {/* Sender Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Sender Details</Text>
                  <Text>Email: {item.userEmail || 'N/A'}</Text>
                </View>

                {/* Receiver Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Receiver Details</Text>
                  <Text>Name: {item.receiver || 'N/A'}</Text>
                  <Text>Address: {item.address || 'N/A'}</Text>
                  <Text>Phone: {item.phone || 'N/A'}</Text>
                  <Text>Note: {item.note || 'None'}</Text>
                </View>

                {/* Order Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Details</Text>
                  <Text>Total Amount: {item.total} BDT</Text>
                  <Text>Items:</Text>
                  {item.items?.map((p: any, idx: number) => (
                    <Text key={idx}>
                      • {p.name} × {p.qty} ({p.price * p.qty} BDT)
                    </Text>
                  ))}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 30 }}>
                No orders found.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ===================== Styles =====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 16,
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    alignSelf: 'center',
    width: '100%'
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#D50000', marginLeft: 5, fontSize: 16, fontWeight: 'bold' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#D50000',
    marginVertical: 20,
  },
  filterRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  filterBtn: {
    borderColor: '#D50000',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 5,
  },
  filterText: { color: '#D50000', fontWeight: '500' },
  activeFilter: { backgroundColor: '#D50000' },
  activeText: { color: '#fff', fontWeight: 'bold' },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: { fontWeight: 'bold', color: '#D50000' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  section: { marginVertical: 5 },
  sectionTitle: { fontWeight: 'bold', color: '#D50000' },
  list: {
    flex: 1,
    width: '100%',
  },
});
