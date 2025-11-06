import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { db } from '../firebaseConfig';

// --- Types ---
interface Reminder {
  id: string;
  title: string;
  date: string;
  day: string;
  month: string;
  recurrence?: 'yearly';
  userId: string;
}

export default function CalenderScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSavedReminders, setShowSavedReminders] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1); // 1-12

  // --- Fetch reminders from Firestore ---
  const fetchReminders = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, 'reminders'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const data: Reminder[] = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title ?? '',
          date: d.date ?? '',
          day: d.day ?? '',
          month: d.month ?? '',
          recurrence: d.recurrence ?? undefined,
          userId: d.userId ?? '',
        };
      });

      setReminders(data);
    } catch (err) {
      console.log(err);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReminders(); }, []);

  // --- Update marked dates for calendar ---
  const updateMarksForMonth = useCallback((year: number, month: number) => {
    const mStr = String(month).padStart(2, '0');
    const marks: { [key: string]: any } = {};
    reminders.forEach(rem => {
      if (rem.recurrence === 'yearly') {
        if (rem.month === mStr) {
          const key = `${year}-${rem.month}-${rem.day}`;
          marks[key] = { marked: true, dotColor: '#D50000' };
        }
      } else if (rem.date) {
        const [ry, rm] = rem.date.split('-');
        if (Number(ry) === year && rm === mStr) {
          marks[rem.date] = { marked: true, dotColor: '#D50000' };
        }
      }
    });
    setMarkedDates(marks);
  }, [reminders]);

  useEffect(() => { updateMarksForMonth(viewYear, viewMonth); }, [reminders, viewYear, viewMonth, updateMarksForMonth]);

  // --- Reminders for selected date ---
  const remindersForDate = reminders.filter(r => {
    if (!selectedDate) return false;
    if (r.date === selectedDate) return true;
    if (r.recurrence === 'yearly' && r.month && r.day) {
      const [, m, d] = selectedDate.split('-');
      return r.month === m && r.day === d;
    }
    return false;
  });

  // --- Delete reminder ---
  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
      Alert.alert('Deleted', 'Reminder deleted successfully');
      fetchReminders();
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to delete reminder');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backWrapper}>
          <Text style={styles.back}>{'< Back'}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>My Calendar</Text>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/date')}>
            <Text style={styles.addButtonText}>+ Add Reminder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.savedButton} onPress={() => setShowSavedReminders(true)}>
            <Text style={styles.addButtonText}>Saved Reminders</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <Calendar
          markedDates={{
            ...markedDates,
            ...(selectedDate ? { [selectedDate]: { selected: true, selectedColor: '#D50000', marked: markedDates[selectedDate]?.marked, dotColor: '#D50000' } } : {})
          }}
          onDayPress={day => setSelectedDate(day.dateString)}
          onMonthChange={month => { setViewYear(month.year); setViewMonth(month.month); }}
          style={styles.calendar}
          theme={{ todayTextColor: '#D50000', selectedDayBackgroundColor: '#D50000' }}
        />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 30 }} />
        ) : selectedDate ? (
          <View style={styles.reminderList}>
            <Text style={styles.reminderTitle}>Reminders for {selectedDate}:</Text>
            {remindersForDate.length === 0 ? (
              <Text style={styles.noReminders}>No reminders for this date.</Text>
            ) : (
              remindersForDate.map(rem => (
                <View key={rem.id} style={styles.reminderBox}>
                  <Text style={styles.reminderText}>{rem.title || 'Reminder'}</Text>
                </View>
              ))
            )}
          </View>
        ) : (
          <Text style={styles.noReminders}>Select a date to view reminders.</Text>
        )}
      </ScrollView>

      {/* Saved Reminders Modal */}
      <Modal
        visible={showSavedReminders}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSavedReminders(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Saved Reminders</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {reminders.length === 0 ? (
                <Text style={styles.noReminders}>No reminders yet.</Text>
              ) : (
                reminders.map(rem => (
                  <View key={rem.id} style={styles.reminderBoxRow}>
                    <Text style={styles.reminderText}>
                      {rem.title} - {rem.date || `${rem.day}/${rem.month}`}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteReminder(rem.id)}>
                      <Ionicons name="trash" size={24} color="#D50000" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowSavedReminders(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Navigation bar */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.push('/homepage')}>
          <Ionicons name="home" size={28} color="#808080" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/cart')}>
          <Ionicons name="cart" size={28} color="#808080" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person" size={28} color="gray" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D50000' },
  backWrapper: { position: 'absolute', top: 30, left: 20, zIndex: 2 },
  back: { color: 'white', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center', marginTop: 60 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginBottom: 16 },
  addButton: { backgroundColor: '#FFF3E0', padding: 12, borderRadius: 20, alignItems: 'center', width: '45%' },
  savedButton: { backgroundColor: '#FFF3E0', padding: 12, borderRadius: 20, alignItems: 'center', width: '45%' },
  addButtonText: { color: '#D50000', fontWeight: 'bold', fontSize: 16 },
  calendar: { borderRadius: 10, marginBottom: 20, backgroundColor: '#FFF3E0', marginHorizontal: 10, padding: 10 },
  reminderList: { flex: 1, marginTop: 10, marginHorizontal: 10 },
  reminderTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#D50000', backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, textAlign: 'center' },
  noReminders: { color: '#888', textAlign: 'center', marginTop: 10, backgroundColor: '#FFF3E0', padding: 10, borderRadius: 8, marginHorizontal: 10 },
  reminderBox: { backgroundColor: '#FFF3E0', borderRadius: 8, padding: 12, marginBottom: 10 },
  reminderBoxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF3E0', borderRadius: 8, padding: 12, marginBottom: 10 },
  reminderText: { color: '#333', fontSize: 16 },
  nav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderColor: '#ccc' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#D50000', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  closeButton: { backgroundColor: '#FFF3E0', padding: 12, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  closeButtonText: { color: '#D50000', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
});
