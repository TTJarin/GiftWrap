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
            <View style={styles.titleRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFF3E0" />
              </TouchableOpacity>
              <ScaledText size={24} style={styles.title}>GiftWrap</ScaledText>
            </View>

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
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF3E0" />
            </TouchableOpacity>
            <ScaledText size={24} style={styles.title}>GiftWrap</ScaledText>
          </View>
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

        
      </View>
    </SafeAreaView>
  );
}



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
  container: { flex: 1, backgroundColor: '#D50000', alignItems: 'center' },
  centeredScroll: { 
    alignItems: 'center', 
    justifyContent: 'flex-start',
    paddingTop: 20,
    paddingBottom: verticalScale(100),
    width: '100%'
  },
  centeredFlatList: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingBottom: verticalScale(100),
    paddingHorizontal: scale(10)
  },
  centerAll: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D50000' },
  titleRow: { 
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 50,
    marginBottom: 20
  },
  backButton: { 
    padding: 6
  },
  title: {
    color: '#FFF3E0',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1
  },
  categoryTitle: { color: 'white', textAlign: 'center', marginBottom: verticalScale(30) },
  productCard: { 
    backgroundColor: '#FFF3E0', 
    width: '45%', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: scale(15),
    borderRadius: scale(10),
    marginHorizontal: scale(5)
  },
  productImage: { 
    width: '100%', 
    height: verticalScale(120), 
    borderRadius: scale(8), 
    marginBottom: verticalScale(12), 
    backgroundColor: '#fff' 
  },
  productName: { 
    fontWeight: 'bold', 
    color: '#D50000', 
    textAlign: 'center',
    fontSize: scaleFont(16),
    marginBottom: verticalScale(4)
  },
  productPrice: { 
    color: '#D50000', 
    marginVertical: verticalScale(4),
    fontSize: scaleFont(14)
  },
  productCategory: { 
    color: '#888', 
    textAlign: 'center', 
    marginBottom: verticalScale(8),
    fontSize: scaleFont(12)
  },
  productDetailImage: { 
    width: scale(250), 
    height: verticalScale(250), 
    borderRadius: scale(12), 
    backgroundColor: '#fff', 
    marginBottom: verticalScale(24)
  },
  productDetailName: { 
    fontWeight: 'bold', 
    color: '#FFF3E0', 
    textAlign: 'center', 
    marginBottom: verticalScale(12),
    width: '90%'
  },
  productDetailPrice: { 
    color: '#FFF3E0', 
    marginTop: verticalScale(8), 
    textAlign: 'center',
    fontSize: scaleFont(20)
  },
  productDetailCategory: { 
    color: '#FFF3E0', 
    marginVertical: verticalScale(12), 
    textAlign: 'center' 
  },
  productDetailDescription: { 
    color: '#FFF3E0', 
    marginBottom: verticalScale(24), 
    textAlign: 'center', 
    paddingHorizontal: scale(25),
    width: '90%',
    lineHeight: verticalScale(22)
  },
  button: { 
    backgroundColor: '#FFF3E0', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: verticalScale(12), 
    paddingHorizontal: scale(25), 
    borderRadius: scale(8), 
    marginTop: verticalScale(10),
    width: '80%'
  },
  buttonText: { 
    color: '#D50000', 
    fontWeight: 'bold',
    fontSize: scaleFont(16)
  },
});
