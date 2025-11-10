import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../firebaseConfig';
import { getFileURL, uploadFile } from '../lib/appwrite.config';

// Define types for data models
type Product = {
  id?: string;
  name: string;
  price: number;
  productsImages: string[];
  category: string;
};

type Filter = {
  id: string;
  name: string;
};

export default function AdminProducts() {
  const router = useRouter();

  // Typed states
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [productsImages, setProductsImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch products
  const fetchProducts = async (): Promise<void> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const data: Product[] = querySnapshot.docs.map((docSnap) => {
        // Omit id to avoid overwriting
        const productData = docSnap.data() as Omit<Product, 'id'>;
        return { id: docSnap.id, ...productData };
      });
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Fetch filters
  const fetchFilters = async (): Promise<void> => {
    try {
      const snap = await getDocs(collection(db, 'filters'));
      const data: Filter[] = snap.docs.map((d) => {
        const filterData = d.data() as Omit<Filter, 'id'>;
        return { id: d.id, ...filterData };
      });
      setFilters(data);
    } catch (error) {
      console.error('Error fetching filters:', error);
      setFilters([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchFilters();
  }, []);

  // Image picker
  const selectMultipleImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Allow photo access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map((asset) => asset.uri);
      setProductsImages(uris);
    }
  };

  const removeProductsImage = (index: number) => {
    setProductsImages(productsImages.filter((_, i) => i !== index));
  };

  const uploadAllImages = async (): Promise<{ products: string[] }> => {
    try {
      const productsRes: string[] = [];
      for (let i = 0; i < productsImages.length; i++) {
        const timestamp = Date.now();
        const fileName = `product_${timestamp}_${i}.jpg`;
        console.log('Uploading image:', fileName);
        
        const file = await uploadFile(productsImages[i], fileName);
        if (file && file.$id) {
          const fileUrl = getFileURL(file.$id);
          productsRes.push(fileUrl);
          console.log('Successfully uploaded:', fileName);
        } else {
          console.error('Upload failed for:', fileName);
        }
      }
      return { products: productsRes };
    } catch (error) {
      console.error('Error in uploadAllImages:', error);
      throw error;
    }
  };

  // Add or update product
  const handleSave = async (): Promise<void> => {
    if (!name || !price || productsImages.length === 0 || !category) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const categoryExists = filters.some((f) => f.name === category);
    if (!categoryExists) {
      Alert.alert(
        'Error',
        'Please select a category from the available filters'
      );
      return;
    }

    setUploading(true);
    const { products: uploadedImageURLs } = await uploadAllImages();
    setUploading(false);

    if (editingId) {
      await updateDoc(doc(db, 'products', editingId), {
        name,
        price: Number(price),
        productsImages: uploadedImageURLs,
        category,
      });
      setEditingId(null);
    } else {
      await addDoc(collection(db, 'products'), {
        name,
        price: Number(price),
        productsImages: uploadedImageURLs,
        category,
      });
    }

    setName('');
    setPrice('');
    setProductsImages([]);
    setCategory('');
    fetchProducts();
  };

  //  Edit product
  const handleEdit = (product: Product) => {
    setEditingId(product.id ?? null);
    setName(product.name);
    setPrice(product.price.toString());
    setProductsImages(product.productsImages);
    setCategory(product.category);
  };

  // Delete product
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
    fetchProducts();
  };

  // UI
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push('/admin')}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={22} color="#D50000" />
            <Text style={styles.backText}>Back</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Manage Products</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.uploadButton} onPress={selectMultipleImages}>
        <Text style={styles.uploadText}>
          {productsImages.length > 0 ? 'Product Image Selected' : 'Upload Product Image'}
        </Text>
      </TouchableOpacity>

      {productsImages.length > 0 && (
        <ScrollView horizontal style={{ marginBottom: 12 }}>
          {productsImages.map((uri, index) => (
            <View key={index} style={{ marginRight: 8 }}>
              <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 8 }} />
              <TouchableOpacity
                onPress={() => removeProductsImage(index)}
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: '#D50000',
                  borderRadius: 12,
                  padding: 2,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.input, styles.pickerButton]}
        onPress={() => setShowCategoryPicker(true)}
      >
        <Text style={{ color: category ? '#000' : '#999' }}>
          {category || 'Select category'}
        </Text>
      </TouchableOpacity>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choose category</Text>
            <FlatList
              data={filters}
              keyExtractor={(item) => item.id}
              renderItem={({ item }: { item: Filter }) => (
                <TouchableOpacity
                  style={styles.filterRow}
                  onPress={() => {
                    setCategory(item.name);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.filterText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', color: '#666' }}>
                  No filters available
                </Text>
              }
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>{editingId ? 'Update' : 'Add'} Product</Text>
      </TouchableOpacity>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id ?? Math.random().toString()}
        renderItem={({ item }: { item: Product }) => (
          <View style={styles.product}>
            <ScrollView horizontal>
              {item.productsImages?.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.image} />
              ))}
            </ScrollView>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text>Price: {item.price} BDT</Text>
              <Text>Category: {item.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              style={styles.editBtn}
            >
              <Text style={{ color: 'white' }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id!)}
              style={styles.deleteBtn}
            >
              <Text style={{ color: 'white' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  backText: { color: '#D50000', marginLeft: 4, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 18, color: '#D50000' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 },
  button: { backgroundColor: '#D50000', padding: 12, borderRadius: 30, marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  product: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 8 },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 5 },
  productName: { fontWeight: 'bold', fontSize: 16 },
  editBtn: { marginHorizontal: 8, padding: 6, backgroundColor: '#e63946', borderRadius: 6 },
  deleteBtn: { padding: 6, backgroundColor: '#e63946', borderRadius: 6 },
  pickerButton: { justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { width: '100%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#D50000', marginBottom: 12, textAlign: 'center' },
  filterRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterText: { fontSize: 16 },
  closeBtn: { backgroundColor: '#D50000', padding: 10, borderRadius: 8, marginTop: 12 },
  uploadButton: { backgroundColor: '#fce4ec', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#D50000' },
  uploadText: { color: '#D50000', fontWeight: 'bold' },
});
