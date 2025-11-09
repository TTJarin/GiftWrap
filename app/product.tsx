import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, CollectionReference, doc, getDoc, getDocs, query, Query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import ScaledText from './components/ScaledText';
import { scale, scaleFont, verticalScale } from './scale';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  picture?: string;
  productsImages?: string[];
}

interface CartItem {
  name: string;
  price: number;
  qty: number;
}

export default function ProductScreen() {
  const router = useRouter();
  const { category, id } = useLocalSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (id && typeof id === 'string') {
          const docRef = doc(db, 'products', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Record<string, any>;
            setProduct({ id: docSnap.id, ...data } as Product);
          } else {
            setProduct(null);
          }
        } else {
          let q: CollectionReference | Query = collection(db, 'products');
          if (category && typeof category === 'string') {
            q = query(collection(db, 'products'), where('category', '==', category));
          }
          const snapshot = await getDocs(q);
          const allProducts: Product[] = snapshot.docs.map(doc => {
            const data = doc.data() as Record<string, any>;
            return { id: doc.id, ...data } as Product;
          });
          setProducts(allProducts);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category, id]);

  const handleAddToCart = async (item: Product) => {
    try {
      const storedCart = await AsyncStorage.getItem('cart');
      let cart: CartItem[] = storedCart ? JSON.parse(storedCart) : [];

      const idx = cart.findIndex(ci => ci.name === item.name && ci.price === item.price);
      if (idx !== -1) {
        cart[idx].qty += 1;
      } else {
        cart.push({ name: item.name, price: item.price, qty: 1 });
      }

      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      alert(`${item.name} added to cart!`);
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  // --- Single product view ---
  if (id && typeof id === 'string') {
    if (loading) return <LoadingScreen />;
    if (!product) return <NotFoundScreen router={router} />;

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.centeredScroll}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={scaleFont(28)} color="#fff" />
            </TouchableOpacity>

            <ScaledText size={scaleFont(28)} style={styles.appTitle}>GiftWrap</ScaledText>

            <Image
              source={{ uri: product.productsImages?.[0] || product.picture || 'https://via.placeholder.com/150' }}
              style={styles.productDetailImage}
            />
            <ScaledText size={scaleFont(22)} style={styles.productDetailName}>{product.name}</ScaledText>
            <ScaledText size={scaleFont(18)} style={styles.productDetailPrice}>{product.price} BDT</ScaledText>
            <ScaledText size={scaleFont(15)} style={styles.productDetailCategory}>Category: {product.category}</ScaledText>
            <ScaledText size={scaleFont(15)} style={styles.productDetailDescription}>{product.description}</ScaledText>

            <TouchableOpacity style={styles.button} onPress={() => handleAddToCart(product)}>
              <ScaledText size={scaleFont(16)} style={styles.buttonText}>Add to Cart</ScaledText>
            </TouchableOpacity>
          </ScrollView>

          <BottomNav router={router} />
        </View>
      </SafeAreaView>
    );
  }

  // --- Multiple products view ---
  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.picture || 'https://via.placeholder.com/120' }} style={styles.productImage} />
      <ScaledText size={scaleFont(16)} style={styles.productName}>{item.name}</ScaledText>
      <ScaledText size={scaleFont(14)} style={styles.productPrice}>{item.price} BDT</ScaledText>
      <ScaledText size={scaleFont(12)} style={styles.productCategory}>Category: {item.category}</ScaledText>
      <TouchableOpacity style={styles.button} onPress={() => handleAddToCart(item)}>
        <ScaledText size={scaleFont(16)} style={styles.buttonText}>Add to Cart</ScaledText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.centeredScroll}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={scaleFont(28)} color="#fff" />
          </TouchableOpacity>

          <ScaledText size={scaleFont(28)} style={styles.appTitle}>GiftWrap</ScaledText>
          <ScaledText size={scaleFont(18)} style={styles.categoryTitle}>{category ? `Category: ${category}` : 'All Products'}</ScaledText>

          <FlatList
            data={products}
            keyExtractor={item => item.id}
            renderItem={renderProduct}
            contentContainerStyle={styles.centeredFlatList}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'center', marginBottom: verticalScale(15) }}
            showsVerticalScrollIndicator={false}
          />
        </ScrollView>

        <BottomNav router={router} />
      </View>
    </SafeAreaView>
  );
}

// --- Bottom navigation ---
const BottomNav = ({ router }: { router: any }) => (
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
);

const LoadingScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.centerAll}>
      <ScaledText size={scaleFont(16)} style={{ color: '#fff' }}>Loading...</ScaledText>
    </View>
  </SafeAreaView>
);

const NotFoundScreen = ({ router }: { router: any }) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.centerAll}>
      <ScaledText size={scaleFont(16)} style={{ color: '#fff', marginBottom: verticalScale(20) }}>Product not found.</ScaledText>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <ScaledText size={scaleFont(16)} style={styles.buttonText}>Go Back</ScaledText>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#D50000' },
  container: { flex: 1, backgroundColor: '#D50000' },
  centeredScroll: { alignItems: 'center', justifyContent: 'center', paddingVertical: verticalScale(60), paddingBottom: verticalScale(100) },
  centeredFlatList: { alignItems: 'center', justifyContent: 'center', paddingBottom: verticalScale(120) },
  centerAll: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D50000' },
  backButton: { position: 'absolute', top: verticalScale(20), left: scale(20), zIndex: 1 },
  appTitle: { color: 'white', fontWeight: 'bold', textAlign: 'center', marginBottom: verticalScale(10) },
  categoryTitle: { color: 'white', textAlign: 'center', marginBottom: verticalScale(20) },
  productCard: { backgroundColor: '#FFF3E0', width: '45%', alignItems: 'center', justifyContent: 'center', padding: scale(10), borderRadius: scale(10) },
  productImage: { width: '100%', height: verticalScale(120), borderRadius: scale(8), marginBottom: verticalScale(8), backgroundColor: '#fff' },
  productName: { fontWeight: 'bold', color: '#D50000', textAlign: 'center' },
  productPrice: { color: '#D50000', marginVertical: verticalScale(2) },
  productCategory: { color: '#888', textAlign: 'center', marginBottom: verticalScale(8) },
  productDetailImage: { width: scale(180), height: verticalScale(180), borderRadius: scale(8), backgroundColor: '#fff', marginBottom: verticalScale(16) },
  productDetailName: { fontWeight: 'bold', color: '#FFF3E0', textAlign: 'center', marginBottom: verticalScale(6) },
  productDetailPrice: { color: '#FFF3E0', marginTop: verticalScale(5), textAlign: 'center' },
  productDetailCategory: { color: '#FFF3E0', marginBottom: verticalScale(10), textAlign: 'center' },
  productDetailDescription: { color: '#FFF3E0', marginBottom: verticalScale(16), textAlign: 'center', paddingHorizontal: scale(20) },
  button: { backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', paddingVertical: verticalScale(10), paddingHorizontal: scale(20), borderRadius: scale(8), marginTop: verticalScale(10) },
  buttonText: { color: '#D50000', fontWeight: 'bold' },
  nav: {
    position: 'absolute', bottom: verticalScale(10), left: 0, right: 0,
    backgroundColor: '#FFF3E0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderTopLeftRadius: scale(12), borderTopRightRadius: scale(12),
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
    height: verticalScale(60),
  },
});
