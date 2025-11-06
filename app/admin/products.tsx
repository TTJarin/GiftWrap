import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, addDoc, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Picker } from '@react-native-picker/picker';

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    price: '',
    image: '',
    category: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'products'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(list);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch filters (categories)
  const fetchFilters = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'filters'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFilters(list);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchFilters();
  }, []);

  // ✅ Handle Add / Update
  const handleSave = async () => {
    if (!form.name.trim() || !form.price.trim() || !form.category) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      if (editingId) {
        // Update product
        await updateDoc(doc(db, 'products', editingId), {
          name: form.name.trim(),
          price: Number(form.price),
          image: form.image.trim(),
          category: form.category,
        });
        Alert.alert('Success', 'Product updated successfully');
      } else {
        // Add new product
        await addDoc(collection(db, 'products'), {
          name: form.name.trim(),
          price: Number(form.price),
          image: form.image.trim(),
          category: form.category,
          createdAt: new Date(),
        });
        Alert.alert('Success', 'Product added successfully');
      }
      setForm({ name: '', price: '', image: '', category: '' });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    }
  };

  // ✅ Delete product
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete product');
    }
  };

  // ✅ Edit product
  const handleEdit = (item: any) => {
    setForm({
      name: item.name,
      price: String(item.price),
      image: item.image || '',
      category: item.category || '',
    });
    setEditingId(item.id);
  };

  return (
    <View style={styles.container}>
      {/* 🔙 Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace('/admin')}>
          <View style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#D50000" />
            <Text style={styles.backText}>Back</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Manage Products</Text>

      {/* 📝 Add/Edit Form */}
      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={form.name}
        onChangeText={(text) => setForm({ ...form, name: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Price (BDT)"
        keyboardType="numeric"
        value={form.price}
        onChangeText={(text) => setForm({ ...form, price: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Image URL"
        value={form.image}
        onChangeText={(text) => setForm({ ...form, image: text })}
      />

      {/* 🏷️ Category Dropdown */}
      <View style={styles.dropdownWrapper}>
        <Picker
          selectedValue={form.category}
          onValueChange={(value) => setForm({ ...form, category: value })}
          style={styles.dropdown}
        >
          <Picker.Item label="Select Category" value="" />
          {filters.map((filter) => (
            <Picker.Item key={filter.id} label={filter.name} value={filter.name} />
          ))}
        </Picker>
      </View>

      {/* 💾 Save / Update Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{editingId ? 'Update Product' : 'Add Product'}</Text>
      </TouchableOpacity>

      {/* 📦 Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#D50000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.details}>Price: {item.price} BDT</Text>
                <Text style={styles.details}>Category: {item.category}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() =>
                    Alert.alert('Delete', `Delete ${item.name}?`, [
                      { text: 'Cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) },
                    ])
                  }
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>No products found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#D50000', marginLeft: 5, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#D50000', marginVertical: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    padding: 12,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  dropdownWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dropdown: {
    height: 50,
    paddingHorizontal: 10,
  },
  saveButton: {
    backgroundColor: '#D50000',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  item: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  details: { fontSize: 14, color: '#666' },
  editBtn: { backgroundColor: '#FFA000', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  editText: { color: 'white', fontWeight: 'bold' },
  deleteBtn: { backgroundColor: '#D50000', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  deleteText: { color: 'white', fontWeight: 'bold' },
});
