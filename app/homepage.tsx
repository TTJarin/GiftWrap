import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import * as Linking from 'expo-linking'; // <-- ADD THIS

// TypeScript interface
interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  picture?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- DEEP LINK HANDLER ---
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (!url) return;

      // If the URL indicates a payment success/fail/cancel, go to homepage
      if (
        url.includes('payment-success') ||
        url.includes('payment-fail') ||
        url.includes('payment-cancel')
      ) {
        router.push('/homepage');
      }
    };

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle initial URL if app was opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, [router]);

  // --- Fetch products (real-time)
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const fetchedProducts = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name || '',
            price: doc.data().price || '',
            category: doc.data().category || '',
            picture: doc.data().picture || '',
          }))
          .sort((a, b) => a.name.localeCompare(b.name)); // alphabetically
        setProducts(fetchedProducts);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- Fetch filters (real-time)
  useEffect(() => {
    const filtersRef = collection(db, 'filters');
    const unsubscribe = onSnapshot(
      filtersRef,
      (snapshot) => {
        const fetchedFilters = snapshot.docs
          .map((doc) => doc.data().name)
          .filter((f): f is string => !!f);
        const defaultFilters = ['All', 'Wedding', 'Birthday', 'Anniversary', 'Farewell'];
        setFilters(Array.from(new Set([...defaultFilters, ...fetchedFilters])));
      },
      (error) => {
        console.error('Error fetching filters:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // --- Filtered products based on search & category
  const filteredProducts = products.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#D50000' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>GiftWrap</Text>
          </View>

          {/* Search Bar */}
          <TextInput
            style={styles.search}
            placeholder="Search products..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Category Dropdown */}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.dropdownButtonText}>{selectedCategory}</Text>
              <Ionicons
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#333"
                style={{ position: 'absolute', right: 12 }}
              />
            </View>
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownList}>
              {filters.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.dropdownItem,
                    selectedCategory === item && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setDropdownOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedCategory === item && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Section */}
          <Text style={styles.sectionTitle}>Trending Now</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
          ) : filteredProducts.length > 0 ? (
            <View style={styles.grid}>
              {filteredProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => router.push({ pathname: '/product', params: { id: item.id } })}
                >
                  {item.picture ? (
                    <Image
                      source={{ uri: item.picture }}
                      style={{ width: '100%', height: 100, borderRadius: 8, marginBottom: 8 }}
                    />
                  ) : null}
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardPrice}>{item.price} BDT</Text>
                  <Text style={{ color: '#888', fontSize: 12 }}>{item.category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#fff', marginTop: 20 }}>No products found</Text>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.push('/homepage')}>
            <Ionicons name="home" size={28} color="#D50000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/cart')}>
            <Ionicons name="cart" size={28} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Ionicons name="person" size={28} color="gray" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// STYLES REMAIN THE SAME
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  search: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 15,
    marginVertical: 15,
    color: '#000',
  },
  dropdown: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffd0b8',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 0,
  },
  dropdownItem: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF7F3',
  },
  dropdownItemText: { color: '#333' },
  dropdownItemTextSelected: { color: '#D50000', fontWeight: '700' },
  dropdownButtonText: { color: '#333', fontWeight: '600', fontSize: 16 },
  sectionTitle: { color: 'white', fontSize: 20, marginVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 10,
    width: '48%',
    marginVertical: 5,
  },
  cardTitle: { fontWeight: 'bold' },
  cardPrice: { color: 'gray', marginTop: 5 },
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
