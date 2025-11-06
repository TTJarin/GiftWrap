import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, addDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function AdminFilters() {
  const router = useRouter();
  const [filters, setFilters] = useState<any[]>([]);
  const [filterName, setFilterName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'filters'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFilters(list);
    } catch (error) {
      console.error('Error fetching filters:', error);
      Alert.alert('Error', 'Failed to fetch filters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFilters(); }, []);

  const handleAdd = async () => {
    if (!filterName.trim()) return Alert.alert('Error', 'Enter a filter name');
    try {
      await addDoc(collection(db, 'filters'), {
        name: filterName.trim(),
        createdAt: new Date(),
      });
      setFilterName('');
      fetchFilters();
    } catch (error) {
      Alert.alert('Error', 'Failed to add filter');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'filters', id));
      fetchFilters();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete filter');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace('/admin')}>
          <View style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#D50000" />
            <Text style={styles.backText}>Back</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Manage Filters</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter new filter name"
        value={filterName}
        onChangeText={setFilterName}
      />
      <TouchableOpacity style={styles.button} onPress={handleAdd}>
        <Text style={styles.buttonText}>Add Filter</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#D50000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => (
            <View style={styles.filterItem}>
              <Text style={styles.filterName}>{item.name}</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Confirm Delete', `Delete "${item.name}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) },
                  ])
                }
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>No filters found.</Text>}
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
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 25, padding: 12, marginBottom: 10, paddingHorizontal: 20 },
  button: { backgroundColor: '#D50000', borderRadius: 25, paddingVertical: 14, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  filterItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 10, padding: 12, marginBottom: 10 },
  filterName: { flex: 1, fontSize: 16, color: '#333' },
  deleteBtn: { backgroundColor: '#D50000', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  deleteText: { color: 'white', fontWeight: 'bold' },
});
