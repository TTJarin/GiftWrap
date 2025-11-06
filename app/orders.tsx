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
  View
} from 'react-native';
import { db } from '../firebaseConfig';

// --- TypeScript types ---
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

        // Fetch orders from Firestore by userId and userEmail
        const qById = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const qByEmail = query(collection(db, 'orders'), where('userEmail', '==', user.email || ''));
        const [snapById, snapByEmail] = await Promise.all([getDocs(qById), getDocs(qByEmail)]);

        const ordersById: Order[] = snapById.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        const ordersByEmail: Order[] = snapByEmail.docs.map(d => ({ id: d.id, ...d.data() } as Order));

        const map = new Map();
        ordersByEmail.forEach(o => map.set(o.id, o));
        ordersById.forEach(o => map.set(o.id, o));
        const firestoreOrders: Order[] = Array.from(map.values());

        // Fetch local orders if available
        let localOrders: Order[] = [];
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem('orders');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                localOrders = parsed.map((o, i) => {
                  let createdAt = o.createdAt;
                  if (createdAt && !createdAt.seconds) {
                    try {
                      createdAt = { seconds: Math.floor(new Date(createdAt).getTime() / 1000) };
                    } catch {
                      createdAt = { seconds: Math.floor(Date.now() / 1000) };
                    }
                  }
                  return { ...o, id: o.id || `local-${i}`, createdAt } as Order;
                });
              }
            }
          }
        } catch (_err) {}

        // Merge Firestore and local orders
        const merged: Order[] = [
          ...(user
            ? localOrders.filter(
                o => (o.userId && o.userId === user.uid) || (o.userEmail && o.userEmail === user.email)
              )
            : localOrders),
          ...firestoreOrders.filter(f => !localOrders.find(l => l.id === f.id)),
        ];

        // Sort by createdAt descending
        const sortedOrders: Order[] = merged.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setOrders(sortedOrders);
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
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity onPress={handleBack} style={styles.backWrapper}>
          <Text style={styles.back}>{'< Back'}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Confirmed Orders</Text>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {loading ? (
            <Text style={{ color: '#fff', marginTop: 20 }}>Loading...</Text>
          ) : orders.length > 0 ? (
            orders.map(order => (
              <View key={order.id} style={styles.orderBox}>
                <Text style={styles.orderText}>Receiver: {order.receiver || 'N/A'}</Text>
                <Text style={styles.orderText}>
                  Items:{' '}
                  {Array.isArray(order.products) && order.products.length > 0
                    ? order.products.map(item => item.name).join(', ')
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
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#D50000' },
  safeArea: { flex: 1 },
  backWrapper: { position: 'absolute', top: 30, left: 20, zIndex: 2 },
  back: { color: 'white', fontSize: 16 },
  title: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 80, textAlign: 'center' },
  scrollContainer: { padding: 20, paddingBottom: 120 },
  orderBox: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 15, marginBottom: 15 },
  orderText: { fontSize: 14, color: '#333', marginBottom: 4 },
  nav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderColor: '#ccc' },
});
