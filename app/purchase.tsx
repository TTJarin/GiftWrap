import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../firebaseConfig';

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#d0021b' },
  container: { flex: 1, paddingTop: 100, paddingHorizontal: 20, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#fff', textAlign: 'center' },
  input: { backgroundColor: '#FFF3E0', borderRadius: 8, padding: 12, marginBottom: 12, color: '#000' },
  button: { backgroundColor: '#FFF3E0', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#d0021b', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#FFF3E0', marginBottom: 12, textDecorationLine: 'underline', textAlign: 'center' },
  box: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FFF3E0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F8D9B6' },
  itemName: { flex: 1.6, color: '#333', fontSize: 15, paddingRight: 8 },
  itemSubtotal: { width: 100, textAlign: 'right', fontWeight: '700', color: '#D50000' },
  headerRow: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderColor: '#F8D9B6', marginBottom: 6, alignItems: 'center', justifyContent: 'space-between' },
  headerProduct: { flex: 1.6, fontWeight: '700', color: '#D50000' },
  headerQty: { width: 64, fontWeight: '700', color: '#D50000', textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  totalLabel: { fontWeight: '700', color: '#D50000' },
  totalAmount: { fontWeight: '900', color: '#D50000' },
  backWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', padding: 6, borderRadius: 8, marginBottom: 12 },
  backText: { color: '#fff', fontSize: 16, marginLeft: 6 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ccc', marginHorizontal: 6, backgroundColor: '#FFF3E0' },
  qtyValue: { minWidth: 28, textAlign: 'center', color: '#000' },
  nav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderTopWidth: 1, borderColor: '#eee', position: 'absolute', left: 0, right: 0, bottom: 0 },
});

export default function PurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cartParam = params?.cart;

  const [receiver, setReceiver] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [purchasedItems, setPurchasedItems] = useState<{ name: string; price: number; qty: number }[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);
  // fallback timer ref used if deep-link doesn't arrive
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle deep link from payment gateway
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url.startsWith("giftwrap://payment-success")) {
        alert("Payment successful!");
        // clear any fallback timer and navigate
        try {
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current as any);
            fallbackTimerRef.current = null;
          }
        } catch {}
        router.push("/homepage");
      } else if (url.startsWith("giftwrap://payment-fail")) {
        alert("Payment failed!");
        try {
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current as any);
            fallbackTimerRef.current = null;
          }
        } catch {}
        router.push("/homepage");
      } else if (url.startsWith("giftwrap://payment-cancel")) {
        alert("Payment cancelled!");
        try {
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current as any);
            fallbackTimerRef.current = null;
          }
        } catch {}
        router.push("/homepage");
      }
    };
    // add listener
    Linking.addEventListener("url", handleDeepLink);

    Linking.getInitialURL().then((url) => url && handleDeepLink({ url }));

    return () => {
      // clear any fallback timer
      try {
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current as any);
          fallbackTimerRef.current = null;
        }
      } catch {}
      Linking.removeAllListeners("url");
    };
  }, [router]);

  useEffect(() => {
    try {
      if (cartParam) {
        const parsed = JSON.parse(cartParam as string);
        if (Array.isArray(parsed)) {
          setPurchasedItems(parsed);
          return;
        }
      }
  } catch {}

    (async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          setPurchasedItems([]);
          return;
        }

        const qById = query(collection(db, 'cart'), where('userId', '==', user.uid), where('selected', '==', true));
        const qByEmail = query(collection(db, 'cart'), where('userEmail', '==', user.email || ''), where('selected', '==', true));
        const [snapById, snapByEmail] = await Promise.all([getDocs(qById), getDocs(qByEmail)]);

        const itemsById: { name: string; price: number; qty: number }[] = [];
        snapById.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.items)) itemsById.push(...data.items);
        });

        const itemsByEmail: { name: string; price: number; qty: number }[] = [];
        snapByEmail.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.items)) itemsByEmail.push(...data.items);
        });

        const map = new Map();
        itemsByEmail.forEach((it) => map.set(`${it.name}__${it.price}`, it));
        itemsById.forEach((it) => map.set(`${it.name}__${it.price}`, it));
        const mergedItems = Array.from(map.values());
        setPurchasedItems(mergedItems);
      } catch {
        setPurchasedItems([]);
      }
    })();
  }, [cartParam]);

  const updateQty = (index: number, change: number) => {
    setPurchasedItems((prev) => {
      const next = [...prev];
      const currentQty = Number(next[index]?.qty) || 1;
      const newQty = currentQty + change;
      if (newQty < 1) next.splice(index, 1);
      else next[index] = { ...next[index], qty: newQty };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setPurchasedItems((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const formatPrice = (value: number | string) => {
    const n = Number(value) || 0;
    return n % 1 === 0 ? `${n} BDT` : `${n.toFixed(2)} BDT`;
  };

  const handlePlaceOrder = async () => {
    if (!receiver || !address || !phone || purchasedItems.length === 0) {
      alert('Please fill all required fields and add at least one product.');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        alert('Please sign in to place an order.');
        return;
      }

      const totalNum = purchasedItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
        0
      );
      const total = Number(totalNum.toFixed(2));

      const response = await fetch('http://172.16.13.246:5000/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total,
          receiver,
          address,
          phone,
          userEmail: user.email || '',
          userId: user.uid || '',
        }),
      });

      const data = await response.json();

      if (data.url) {
        Linking.openURL(data.url);
      } else {
        alert('Failed to get payment URL.');
        console.log('Payment response:', data);
      }
    } catch (err) {
      console.error('Place order error:', err);
      alert('Failed to initiate payment.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#d0021b' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backWrapper}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Purchase Details</Text>

        <View style={styles.box}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6, color: '#D50000' }}>Selected Items</Text>
          {purchasedItems.length === 0 ? (
            <Text style={{ color: '#888' }}>No items selected from cart.</Text>
          ) : (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.headerProduct}>Product</Text>
                <Text style={styles.headerQty}>Qty</Text>
              </View>
              {purchasedItems.map((item, idx) => {
                const qty = Number(item.qty) || 1;
                return (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity onPress={() => updateQty(idx, -1)} style={styles.qtyBtn}>
                        <Text>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{qty}</Text>
                      <TouchableOpacity onPress={() => updateQty(idx, 1)} style={styles.qtyBtn}>
                        <Text>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeItem(idx)} style={{ marginLeft: 8 }}>
                        <Ionicons name="trash" size={18} color="#d0021b" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total Items: {purchasedItems.reduce((sum, item) => sum + (Number(item.qty) || 1), 0)}
                </Text>
                <Text style={styles.totalAmount}>
                  {formatPrice(
                    purchasedItems.reduce(
                      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
                      0
                    )
                  )}
                </Text>
              </View>
            </>
          )}
        </View>

        <TextInput style={styles.input} placeholder="Receiver name" value={receiver} onChangeText={setReceiver} />
        <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput style={styles.input} placeholder="Special Note" value={note} onChangeText={setNote} />

        <TouchableOpacity onPress={() => setShowBreakdown(!showBreakdown)}>
          <Text style={styles.link}>Payment Breakdown</Text>
        </TouchableOpacity>

        {showBreakdown && (
          <View style={[styles.box, { padding: 12, marginBottom: 12 }]}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8, color: '#D50000' }}>Price Breakdown</Text>
            {purchasedItems.map((item, idx) => {
              const unitPrice = Number(item.price) || 0;
              const qty = Number(item.qty) || 1;
              const subtotal = unitPrice * qty;
              return (
                <View key={idx} style={[styles.itemRow, { paddingVertical: 10 }]}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={{ width: 120, textAlign: 'center', color: '#333' }}>
                    {formatPrice(unitPrice)} × {qty}
                  </Text>
                  <Text style={[styles.itemSubtotal, { width: 100, textAlign: 'right' }]}>
                    {formatPrice(subtotal)}
                  </Text>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                {formatPrice(
                  purchasedItems.reduce(
                    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
                    0
                  )
                )}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handlePlaceOrder}>
          <Text style={styles.buttonText}>Place Order</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.push('/homepage')}>
          <Ionicons name="home" size={28} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/cart')}>
          <Ionicons name="cart" size={28} color="#D50000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person" size={28} color="gray" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
