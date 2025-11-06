import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type CartItem = {
  name: string;
  price: number;
  qty: number;
};

type ParamsType = {
  name?: string | string[];
  price?: string | string[];
  qty?: string | string[];
};

export default function Cart() {
  const router = useRouter();
  const params = useLocalSearchParams<ParamsType>();

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);

  // Initialize Firebase auth listener
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Load cart for signed-in user
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setCart([]);
      return;
    }

    try {
      const key = `cart_${user.uid}`;
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(key);
        if (stored) setCart(JSON.parse(stored));
        else setCart([]);
      }
    } catch {
      setCart([]);
    }
  }, [authReady, user]);

  // Handle incoming add-to-cart params
  useEffect(() => {
    if (!authReady) return;

    const name = Array.isArray(params.name) ? params.name[0] : params.name;
    const price = Array.isArray(params.price) ? params.price[0] : params.price;
    const qty = Array.isArray(params.qty) ? params.qty[0] : params.qty;

    if (name && price) {
      if (!user) {
        // Require login first
        setTimeout(() => {
          try {
            router.push('/login');
          } catch {}
        }, 0);
        return;
      }

      setCart((prevCart) => {
        const idx = prevCart.findIndex(
          (item) => item.name === name && item.price === parseInt(price)
        );
        if (idx !== -1) {
          const updated = [...prevCart];
          updated[idx].qty += qty ? parseInt(qty) : 1;
          return updated;
        } else {
          return [
            ...prevCart,
            {
              name,
              price: parseInt(price),
              qty: qty ? parseInt(qty) : 1,
            },
          ];
        }
      });
    }
  }, [authReady, user, params.name, params.price, params.qty, router]);

  // Keep `selected` array synced
  useEffect(() => {
    setSelected((sel) => cart.map((_, idx) => sel[idx] ?? false));
  }, [cart]);

  // Persist cart for user
  useEffect(() => {
    if (!user) return;
    try {
      const key = `cart_${user.uid}`;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(cart));
      }
    } catch {}
  }, [cart, user]);

  const updateQty = (index: number, change: number) => {
    setCart((prevCart) => {
      const newCart = [...prevCart];
      newCart[index].qty += change;
      if (newCart[index].qty < 1) newCart.splice(index, 1);
      return newCart;
    });
  };

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const handleCheckout = () => {
    const checkedItems = cart.filter((_, idx) => selected[idx]);
    if (checkedItems.length === 0) return;

    const query = encodeURIComponent(JSON.stringify(checkedItems));
    router.push(`/purchase?cart=${query}`);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backWrapper}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>My Cart</Text>

        {cart.map((item, index) => (
          <View key={index} style={styles.itemBox}>
            <View style={styles.row}>
              <Text style={[styles.itemName, { flex: 1 }]} numberOfLines={2}>
                {item.name}
              </Text>
              <Pressable
                onPress={() => toggleSelect(index)}
                style={[
                  styles.checkbox,
                  { backgroundColor: selected[index] ? '#d0021b' : '#fff' },
                ]}
              >
                {selected[index] && <Ionicons name="checkmark" size={16} color="#fff" />}
              </Pressable>
            </View>

            <Text style={styles.price}>{item.price} BDT</Text>

            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => updateQty(index, -1)}>
                <Text style={styles.qtyBtn}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.qty}</Text>
              <TouchableOpacity onPress={() => updateQty(index, 1)}>
                <Text style={styles.qtyBtn}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {cart.length > 0 && (
          <TouchableOpacity style={styles.button} onPress={handleCheckout}>
            <Text style={styles.buttonText}>Check Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.push('/homepage')}>
          <Ionicons name="home" size={28} color="#808080" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/cart')}>
          <Ionicons name="cart" size={28} color="#D50000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person" size={28} color="gray" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#d0021b' },
  container: { paddingTop: 100, paddingHorizontal: 20, paddingBottom: 120 },
  backWrapper: { padding: 6, marginBottom: 12 },
  backText: { color: '#fff', fontSize: 16 },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  itemBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d0021b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontWeight: '600', fontSize: 16 },
  price: { fontWeight: 'bold', marginTop: 5, color: '#555' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  qtyBtn: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 10, color: '#d0021b' },
  qtyValue: { fontSize: 16, fontWeight: '600' },
  button: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { color: '#d0021b', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
});
