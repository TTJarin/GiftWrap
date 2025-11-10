import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CartItem = { name: string; price: number; qty: number };

export default function Cart() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);

  useEffect(() => {
    const loadCart = async () => {
      const stored = await AsyncStorage.getItem('cart');
      const data = stored ? JSON.parse(stored) : [];
      setCart(data);
      setSelected(data.map(() => false));
    };
    loadCart();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const updateQty = (index: number, change: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[index].qty += change;
      if (newCart[index].qty < 1) newCart.splice(index, 1);
      setSelected(newCart.map((_, i) => selected[i] ?? false));
      return newCart;
    });
  };

  const toggleSelect = (index: number) => {
    setSelected(prev => {
      const newSel = [...prev];
      newSel[index] = !newSel[index];
      return newSel;
    });
  };

  const handleCheckout = async () => {
    const checkedItems = cart.filter((_, i) => selected[i]);
    if (checkedItems.length === 0) {
      Alert.alert('No Item Selected', 'Please select at least one item before checkout.');
      return;
    }

    
    router.push(`/purchase?cart=${encodeURIComponent(JSON.stringify(checkedItems))}`);

    try {
      const updatedCart = cart.filter((_, i) => !selected[i]);
      setCart(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
      setSelected(updatedCart.map(() => false));
    } catch (error) {
      console.error('Error updating cart after checkout:', error);
    }
  };

  const renderItem = ({ item, index }: { item: CartItem; index: number }) => (
    <View style={styles.itemBox}>
      <View style={styles.row}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Pressable
          onPress={() => toggleSelect(index)}
          style={[styles.checkbox, { backgroundColor: selected[index] ? '#d0021b' : '#fff' }]}
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
  );

  return (
    <View style={styles.wrapper}>
      {/* ✅ Back Arrow */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#FFF3E0" />
      </TouchableOpacity>

      <Text style={styles.title}>All Cart Items</Text>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty. Add some products to continue!</Text>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 200 }}
        />
      )}

      {cart.length > 0 && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleCheckout}>
            <Text style={styles.buttonText}>Check Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#d0021b' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  title: {
    color: '#FFF3E0',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 16, textAlign: 'center', paddingHorizontal: 30 },
  itemBox: { backgroundColor: '#FFF3E0', padding: 15, borderRadius: 10, marginBottom: 15, top: 50 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontWeight: '600', fontSize: 16 },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d0021b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: { fontWeight: 'bold', marginTop: 5, color: '#555' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  qtyBtn: { fontSize: 20, fontWeight: 'bold', color: '#d0021b', paddingHorizontal: 10 },
  qtyValue: { fontSize: 16, fontWeight: '600' },
  buttonContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: { color: '#d0021b', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});
