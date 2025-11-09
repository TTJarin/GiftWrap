import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import ScaledText from './components/ScaledText';
import { scale, scaleFont, verticalScale } from './scale';

// --- Product Type ---
interface Product {
  id: string;
  name: string;
  price: number;
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

  // --- Real-time Products ---
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const fetchedProducts = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '',
          price: doc.data().price || 0,
          category: doc.data().category || '',
          picture:
            (doc.data().productsImages && doc.data().productsImages[0]) ||
            doc.data().picture ||
            '',
        }));
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

  // --- Real-time Filters ---
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

  // --- Filtered Products ---
  const filteredProducts = products.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <ScaledText size={28} style={styles.logo}>GiftWrap</ScaledText>
          </View>

          {/* Search */}
          <TextInput
            style={[styles.search, { padding: verticalScale(10), borderRadius: scale(15), marginVertical: verticalScale(15) }]}
            placeholder="Search products..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Category Dropdown */}
          <TouchableOpacity
            style={[styles.dropdown, { padding: verticalScale(12), borderRadius: scale(12), marginTop: verticalScale(12) }]}
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <ScaledText size={16} style={styles.dropdownButtonText}>{selectedCategory}</ScaledText>
              <Ionicons
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={scaleFont(18)}
                color="#333"
                style={{ position: 'absolute', right: scale(12) }}
              />
            </View>
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={[styles.dropdownList, { borderRadius: scale(10) }]}>
              {filters.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.dropdownItem,
                    selectedCategory === item && styles.dropdownItemSelected,
                    { paddingVertical: verticalScale(12), paddingHorizontal: scale(14) },
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setDropdownOpen(false);
                  }}
                >
                  <ScaledText
                    size={14}
                    style={[
                      styles.dropdownItemText,
                      selectedCategory === item && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {item}
                  </ScaledText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Trending Products */}
          <ScaledText size={20} style={styles.sectionTitle}>Trending Now</ScaledText>

          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: verticalScale(20) }} />
          ) : filteredProducts.length > 0 ? (
            <View style={styles.grid}>
              {filteredProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, { padding: scale(10), borderRadius: scale(10), marginVertical: verticalScale(5) }]}
                  onPress={() => router.push({ pathname: '/product', params: { id: item.id } })}
                >
                  {item.picture && (
                    <Image
                      source={{ uri: item.picture }}
                      style={{ width: '100%', height: verticalScale(100), borderRadius: scale(8), marginBottom: verticalScale(8) }}
                    />
                  )}
                  <ScaledText size={14} style={styles.cardTitle}>{item.name}</ScaledText>
                  <ScaledText size={12} style={styles.cardPrice}>{item.price} BDT</ScaledText>
                  <ScaledText size={12} style={{ color: '#888' }}>{item.category}</ScaledText>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <ScaledText size={14} style={{ color: '#fff', marginTop: verticalScale(20) }}>No products found</ScaledText>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.push('/homepage')}>
            <Ionicons name="home" size={scaleFont(28)} color="#D50000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/cart')}>
            <Ionicons name="cart" size={scaleFont(28)} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Ionicons name="person" size={scaleFont(28)} color="gray" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#D50000' },
  scrollContainer: { padding: scale(20), paddingBottom: Platform.OS === 'ios' ? verticalScale(120) : verticalScale(100) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: 'white', fontWeight: 'bold', textAlign: 'center', marginVertical: verticalScale(10) },
  search: { backgroundColor: '#FFF3E0', color: '#000' },
  dropdown: { backgroundColor: '#FFF3E0', alignItems: 'center', borderWidth: 1, borderColor: '#ffd0b8' },
  dropdownList: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  dropdownItem: { borderBottomWidth: 1, borderBottomColor: '#f2f2f2' },
  dropdownItemSelected: { backgroundColor: '#FFF7F3' },
  dropdownItemText: { color: '#333' },
  dropdownItemTextSelected: { color: '#D50000', fontWeight: '700' },
  dropdownButtonText: { color: '#333', fontWeight: '600' },
  sectionTitle: { color: 'white', marginVertical: verticalScale(10) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#FFF3E0', width: '48%' },
  cardTitle: { fontWeight: 'bold' },
  cardPrice: { color: 'gray', marginTop: verticalScale(5) },
  nav: {
    position: 'absolute', bottom: verticalScale(10), left: 0, right: 0,
    backgroundColor: '#FFF3E0', flexDirection: 'row',
    justifyContent: 'space-around', alignItems: 'center',
    borderTopLeftRadius: scale(12), borderTopRightRadius: scale(12),
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
    height: verticalScale(60),
  },
});
