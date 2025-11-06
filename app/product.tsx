import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where, CollectionReference, Query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../firebaseConfig';

// --- Product type ---
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  picture?: string;
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
          // Fetch single product by id
          const docRef = doc(db, 'products', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
          } else {
            setProduct(null);
          }
        } else {
          // Fetch all products or by category
          let q: CollectionReference | Query = collection(db, 'products');
          if (category && typeof category === 'string') {
            q = query(collection(db, 'products'), where('category', '==', category));
          }

          const snapshot = await getDocs(q);
          setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, id]);

  const handleAddToCart = (item: Product) => {
    router.push({
      pathname: '/cart',
      params: {
        name: item.name,
        price: item.price,
        qty: '1',
      },
    });
  };

  if (id && typeof id === 'string') {
    if (loading) return <LoadingScreen />;
    if (!product) return <NotFoundScreen router={router} />;

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.appTitle}>GiftWrap</Text>
        <View style={styles.productDetail}>
          <Image source={{ uri: product.picture }} style={styles.productDetailImage} />
          <Text style={styles.productDetailName}>{product.name}</Text>
          <Text style={styles.productDetailPrice}>{product.price} BDT</Text>
          <Text style={styles.productDetailCategory}>Category: {product.category}</Text>
          <Text style={styles.productDetailDescription}>{product.description}</Text>
          <TouchableOpacity style={styles.button} onPress={() => handleAddToCart(product)}>
            <Text style={styles.buttonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
        <BottomNav router={router} />
      </View>
    );
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.picture }} style={styles.productImage} />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.price} BDT</Text>
      <Text style={styles.productCategory}>Category: {item.category}</Text>
      <TouchableOpacity style={styles.button} onPress={() => handleAddToCart(item)}>
        <Text style={styles.buttonText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{'< Back'}</Text>
      </TouchableOpacity>
      <Text style={styles.appTitle}>GiftWrap</Text>
      <Text style={styles.categoryTitle}>{category && typeof category === 'string' ? `Category: ${category}` : 'All Products'}</Text>
      {loading ? (
        <Text style={{ color: '#fff', marginTop: 20 }}>Loading...</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 15 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <BottomNav router={router} />
    </View>
  );
}

const BottomNav = ({ router }: { router: any }) => (
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
);

const LoadingScreen = () => (
  <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
    <Text style={{ color: '#fff', marginTop: 20 }}>Loading...</Text>
  </View>
);

const NotFoundScreen = ({ router }: { router: any }) => (
  <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
    <Text style={{ color: '#fff', marginBottom: 20 }}>Product not found.</Text>
    <TouchableOpacity onPress={() => router.back()} style={styles.button}>
      <Text style={styles.buttonText}>Go Back</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D50000', paddingTop: 0 },
  backButton: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 30, left: 20, zIndex: 1 },
  backText: { color: 'white', marginLeft: 6, fontSize: 16 },
  appTitle: { fontSize: 28, color: 'white', fontWeight: 'bold', textAlign: 'center', marginTop: 60, marginBottom: 10 },
  categoryTitle: { fontSize: 18, color: 'white', textAlign: 'center', marginBottom: 20 },
  listContent: { paddingBottom: 120, paddingHorizontal: 10 },
  productCard: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 10, width: '48%', alignItems: 'center' },
  productImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8, backgroundColor: '#fff' },
  productName: { fontWeight: 'bold', color: '#D50000', fontSize: 16, textAlign: 'center' },
  productPrice: { color: '#D50000', fontSize: 14, marginVertical: 2 },
  productCategory: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 8 },
  productDetail: { alignItems: 'center', marginTop: 30, marginBottom: 30, width: '100%' },
  productDetailImage: { width: 150, height: 150, borderRadius: 8, marginBottom: 16, backgroundColor: '#fff' },
  productDetailName: { fontWeight: 'bold', color: '#FFF3E0', fontSize: 22, textAlign: 'center', marginBottom: 6 },
  productDetailPrice: { color: '#FFF3E0', marginTop: 5, fontSize: 18, textAlign: 'center' },
  productDetailCategory: { fontSize: 15, color: '#FFF3E0', marginBottom: 10, textAlign: 'center' },
  productDetailDescription: { fontSize: 15, color: '#FFF3E0', marginBottom: 16, textAlign: 'center', paddingHorizontal: 20 },
  button: { backgroundColor: '#FFF3E0', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#D50000', fontWeight: 'bold', fontSize: 16 },
  nav: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, 
    backgroundColor: '#FFF3E0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
});
