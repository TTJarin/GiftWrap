import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { db } from '../firebaseConfig';
import { scale, scaleFont, verticalScale } from './scale';

const BASE_URL = 'https://giftwrap-ssl-backend.onrender.com';

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
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

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
        if (!user) return;

        const qById = query(
          collection(db, 'cart'),
          where('userId', '==', user.uid),
          where('selected', '==', true)
        );
        const qByEmail = query(
          collection(db, 'cart'),
          where('userEmail', '==', user.email || ''),
          where('selected', '==', true)
        );

        const [snapById, snapByEmail] = await Promise.all([getDocs(qById), getDocs(qByEmail)]);
        const items: { name: string; price: number; qty: number }[] = [];

        snapById.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.items)) items.push(...data.items);
        });
        snapByEmail.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.items)) items.push(...data.items);
        });

        const map = new Map<string, { name: string; price: number; qty: number }>();
        items.forEach((it) => map.set(`${it.name}__${it.price}`, it));
        setPurchasedItems(Array.from(map.values()));
      } catch (err) {
        console.error(err);
        setPurchasedItems([]);
      }
    })();
  }, [cartParam]);

  const updateQty = (index: number, change: number) => {
    setPurchasedItems((prev) => {
      const next = [...prev];
      const qty = (next[index]?.qty || 1) + change;
      if (qty < 1) next.splice(index, 1);
      else next[index] = { ...next[index], qty };
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
      if (!user) return alert('Please sign in to place an order.');

      const total = purchasedItems.reduce((sum, item) => sum + item.price * item.qty, 0);

      const response = await fetch(`${BASE_URL}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total,
          receiver,
          address,
          phone,
          items: purchasedItems,
          userEmail: user.email || '',
          userId: user.uid || '',
        }),
      });

      const data: any = await response.json();
      if (data.url) {
        await addDoc(collection(db, 'orders'), {
          userId: user.uid,
          userEmail: user.email || '',
          receiver,
          address,
          phone,
          note,
          items: purchasedItems,
          total,
          status: 'pending',
          createdAt: new Date(),
        });
        setPaymentUrl(data.url);
      } else alert('Failed to get payment URL.');
    } catch (err) {
      console.error(err);
      alert('Failed to initiate payment.');
    }
  };

  if (paymentUrl) {
    return <WebView source={{ uri: paymentUrl }} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: verticalScale(200),
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
            <Ionicons name="arrow-back" size={scale(28)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Purchase Details</Text>
        </View>

        {/* Selected Items */}
        <View style={[styles.box, { width: '90%' }]}>
          <Text style={styles.boxTitle}>Selected Items</Text>
          {purchasedItems.length === 0 ? (
            <Text style={styles.noItems}>No items selected from cart.</Text>
          ) : (
            <>
              <View style={styles.headerRow}>
                <Text style={styles.headerProduct}>Product</Text>
                <Text style={styles.headerQty}>Qty</Text>
              </View>
              {purchasedItems.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => updateQty(idx, -1)} style={styles.qtyBtn}>
                      <Text>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => updateQty(idx, 1)} style={styles.qtyBtn}>
                      <Text>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeItem(idx)} style={{ marginLeft: scale(8) }}>
                      <Ionicons name="trash" size={scale(18)} color="#d0021b" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Total Items: {purchasedItems.reduce((sum, i) => sum + i.qty, 0)}
                </Text>
                <Text style={styles.totalAmount}>
                  {formatPrice(purchasedItems.reduce((s, i) => s + i.price * i.qty, 0))}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Receiver Info */}
        <TextInput style={[styles.input, { width: '90%' }]} placeholder="Receiver name" value={receiver} onChangeText={setReceiver} />
        <TextInput style={[styles.input, { width: '90%' }]} placeholder="Address" value={address} onChangeText={setAddress} />
        <TextInput style={[styles.input, { width: '90%' }]} placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={[styles.input, { width: '90%' }]} placeholder="Special Note" value={note} onChangeText={setNote} />

        <TouchableOpacity onPress={() => setShowBreakdown(!showBreakdown)}>
          <Text style={styles.link}>Payment Breakdown</Text>
        </TouchableOpacity>

        {showBreakdown && (
          <View style={[styles.box, { padding: scale(12), marginBottom: verticalScale(12), width: '90%' }]}>
            {purchasedItems.map((item, idx) => {
              const subtotal = item.price * item.qty;
              return (
                <View key={idx} style={[styles.itemRow, { paddingVertical: verticalScale(10) }]}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={[styles.itemSubtotal, { width: scale(100), textAlign: 'right' }]}>{formatPrice(subtotal)}</Text>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{formatPrice(purchasedItems.reduce((s, i) => s + i.price * i.qty, 0))}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Place Order */}
      <View style={styles.stickyButtonWrapper}>
        <TouchableOpacity style={[styles.button, { width: '90%' }]} onPress={handlePlaceOrder}>
          <Text style={styles.buttonText}>Place Order</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.push('/homepage')}>
          <Ionicons name="home" size={scale(28)} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/cart')}>
          <Ionicons name="cart" size={scale(28)} color="#D50000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person" size={scale(28)} color="gray" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#d0021b' },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(20) },
  backArrow: { padding: scale(6) },
  title: { fontSize: scaleFont(24), fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  input: { backgroundColor: '#FFF3E0', borderRadius: scale(8), padding: scale(12), marginBottom: verticalScale(12), color: '#000', fontSize: scaleFont(15) },
  button: { backgroundColor: '#FFF3E0', borderRadius: scale(8), paddingVertical: verticalScale(16), alignItems: 'center' },
  buttonText: { color: '#d0021b', fontWeight: 'bold', fontSize: scaleFont(16) },
  link: { color: '#FFF3E0', marginBottom: verticalScale(12), textDecorationLine: 'underline', textAlign: 'center', fontSize: scaleFont(14) },
  box: { backgroundColor: '#FFF3E0', borderRadius: scale(12), padding: scale(14), marginBottom: verticalScale(18), borderWidth: 1, borderColor: '#FFF3E0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: scale(4), elevation: 2 },
  boxTitle: { fontWeight: 'bold', fontSize: scaleFont(16), marginBottom: verticalScale(6), color: '#D50000', textAlign: 'center' },
  noItems: { color: '#888', fontSize: scaleFont(14), textAlign: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: verticalScale(10), borderBottomWidth: 1, borderColor: '#F8D9B6' },
  itemName: { flex: 1.6, color: '#333', fontSize: scaleFont(15), paddingRight: scale(8) },
  itemSubtotal: { fontWeight: '700', color: '#D50000' },
  headerRow: { flexDirection: 'row', paddingBottom: verticalScale(6), borderBottomWidth: 1, borderColor: '#F8D9B6', marginBottom: verticalScale(6), alignItems: 'center', justifyContent: 'space-between' },
  headerProduct: { flex: 1.6, fontWeight: '700', color: '#D50000', fontSize: scaleFont(15) },
  headerQty: { width: scale(64), fontWeight: '700', color: '#D50000', textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: verticalScale(10) },
  totalLabel: { fontWeight: '700', color: '#D50000', fontSize: scaleFont(15) },
  totalAmount: { fontWeight: '900', color: '#D50000', fontSize: scaleFont(16) },
  qtyBtn: { width: scale(28), height: scale(28), borderRadius: scale(6), alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ccc', marginHorizontal: scale(6), backgroundColor: '#FFF3E0' },
  qtyValue: { minWidth: scale(28), textAlign: 'center', color: '#000', fontSize: scaleFont(14) },
  nav: { position: 'absolute', bottom: verticalScale(30), left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: verticalScale(12), borderTopWidth: 1, borderColor: '#ccc', borderTopLeftRadius: scale(15), borderTopRightRadius: scale(15) },
  stickyButtonWrapper: { position: 'absolute', bottom: verticalScale(90), left: scale(20), right: scale(20), alignItems: 'center' },
});
