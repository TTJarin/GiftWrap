import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { db } from '../firebaseConfig';

interface Product {
  name: string;
  [key: string]: any;
}

interface Order {
  id: string;
  receiver: string;
  products: Product[];
  total: number;
  delivered: boolean;
  createdAt: { seconds: number };
  userId?: string;
  userEmail?: string;
  [key: string]: any;
}

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const qById = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const qByEmail = query(collection(db, 'orders'), where('userEmail', '==', user.email || ''));
        const [snapById, snapByEmail] = await Promise.all([getDocs(qById), getDocs(qByEmail)]);

        const ordersById: Order[] = snapById.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        const ordersByEmail: Order[] = snapByEmail.docs.map(d => ({ id: d.id, ...d.data() } as Order));

        const map = new Map();
        ordersByEmail.forEach(o => map.set(o.id, o));
        ordersById.forEach(o => map.set(o.id, o));
        const firestoreOrders: Order[] = Array.from(map.values());

        const merged: Order[] = firestoreOrders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        setOrders(merged);
      } catch (_err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleBack = () => router.replace('/profile');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.wrapper}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.title}>Confirmed Orders</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {loading ? (
              <Text style={{ color: '#fff', marginTop: 20 }}>Loading...</Text>
            ) : orders.length > 0 ? (
              orders.map(order => (
                <View key={order.id} style={styles.orderBox}>
                  <Text style={styles.orderText}>Receiver: {order.receiver || 'N/A'}</Text>
                  <Text style={styles.orderText}>
                    Items:{' '}
                    {Array.isArray(order.items) && order.items.length > 0
                      ? order.items.map(item => item.name).join(', ')
                      : 'N/A'}
                  </Text>
                  <Text style={styles.orderText}>Total: {order.total ?? 'N/A'} BDT</Text>
                  <Text style={styles.orderText}>
                    Status: {order.delivered ? 'Delivered' : 'Pending'}
                  </Text>
                  <Text style={styles.orderText}>
                    Date:{' '}
                    {order.createdAt && order.createdAt.seconds
                      ? new Date(order.createdAt.seconds * 1000).toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: '#fff', marginTop: 20 }}>No orders found</Text>
            )}
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
            <Ionicons name="person" size={28} color="gray" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#D50000' },
  safeArea: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? 30 : 0, // ✅ fix for top spacing
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 10, 
  },
  title: { 
    color: 'white', 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginLeft: 15, 
    textAlign: 'center' 
  },
  scrollContainer: { 
    padding: 20, 
    paddingBottom: 120 
  },
  orderBox: { 
    backgroundColor: '#FFF3E0', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 15 
  },
  orderText: { 
    fontSize: 14, 
    color: '#333', 
    marginBottom: 4 
  },
  nav: { 
    position: 'absolute', 
    bottom: 30,
    left: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderColor: '#ccc',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
});
