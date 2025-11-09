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
import { scale, verticalScale, scaleFont } from './scale'; // <- scaling

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

export default function CalendarScreen() {
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
      <ScrollView contentContainerStyle={{ paddingBottom: verticalScale(120) }} keyboardShouldPersistTaps="handled">
        {/* Back Arrow */}
        <TouchableOpacity onPress={() => router.replace('/profile')} style={[styles.backWrapper, { top: verticalScale(65), left: scale(20) }]}>
          <Ionicons name="arrow-back" size={scaleFont(28)} color="white" />
        </TouchableOpacity>

        <Text style={[styles.title, { fontSize: scaleFont(28), marginTop: verticalScale(60), marginBottom: verticalScale(20) }]}>My Calendar</Text>

        {/* Buttons */}
        <View style={[styles.buttonContainer, { marginHorizontal: scale(20), marginBottom: verticalScale(16) }]}>
          <TouchableOpacity style={[styles.addButton, { padding: verticalScale(12), borderRadius: scale(20), width: '45%' }]} onPress={() => router.push('/date')}>
            <Text style={[styles.addButtonText, { fontSize: scaleFont(16) }]}>+ Add Reminder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.savedButton, { padding: verticalScale(12), borderRadius: scale(20), width: '45%' }]} onPress={() => setShowSavedReminders(true)}>
            <Text style={[styles.addButtonText, { fontSize: scaleFont(16) }]}>Saved Reminders</Text>
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
          style={[styles.calendar, { marginHorizontal: scale(10), padding: scale(10), borderRadius: scale(10), marginBottom: verticalScale(20) }]}
          theme={{ todayTextColor: '#D50000', selectedDayBackgroundColor: '#D50000' }}
        />

        {loading ? (
          <ActivityIndicator style={{ marginTop: verticalScale(30) }} />
        ) : selectedDate ? (
          <View style={styles.reminderList}>
            <Text style={[styles.reminderTitle, { fontSize: scaleFont(18), marginBottom: verticalScale(10), padding: verticalScale(10), borderRadius: scale(8) }]}>
              Reminders for {selectedDate}:
            </Text>
            {remindersForDate.length === 0 ? (
              <Text style={[styles.noReminders, { padding: verticalScale(10), borderRadius: scale(8), marginHorizontal: scale(10), marginTop: verticalScale(10) }]}>No reminders for this date.</Text>
            ) : (
              remindersForDate.map(rem => (
                <View key={rem.id} style={[styles.reminderBox, { padding: verticalScale(12), borderRadius: scale(8), marginBottom: verticalScale(10) }]}>
                  <Text style={[styles.reminderText, { fontSize: scaleFont(16) }]}>{rem.title || 'Reminder'}</Text>
                </View>
              ))
            )}
          </View>
        ) : (
          <Text style={[styles.noReminders, { padding: verticalScale(10), borderRadius: scale(8), marginHorizontal: scale(10), marginTop: verticalScale(10) }]}>Select a date to view reminders.</Text>
        )}
      </ScrollView>

      {/* Saved Reminders Modal */}
      <Modal
        visible={showSavedReminders}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSavedReminders(false)}
      >
        <View style={[styles.modalOverlay, { padding: scale(20) }]}>
          <View style={[styles.modalContent, { borderRadius: scale(20), padding: scale(20) }]}>
            <Text style={[styles.modalTitle, { fontSize: scaleFont(22), marginBottom: verticalScale(20) }]}>Saved Reminders</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: verticalScale(20) }}>
              {reminders.length === 0 ? (
                <Text style={[styles.noReminders, { padding: verticalScale(10), borderRadius: scale(8), marginHorizontal: scale(10) }]}>No reminders yet.</Text>
              ) : (
                reminders.map(rem => (
                  <View key={rem.id} style={[styles.reminderBoxRow, { padding: verticalScale(12), borderRadius: scale(8), marginBottom: verticalScale(10) }]}>
                    <Text style={[styles.reminderText, { fontSize: scaleFont(16) }]}>
                      {rem.title} - {rem.date || `${rem.day}/${rem.month}`}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteReminder(rem.id)}>
                      <Ionicons name="trash" size={scaleFont(24)} color="#D50000" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.closeButton, { padding: verticalScale(12), borderRadius: scale(20), marginTop: verticalScale(10) }]} onPress={() => setShowSavedReminders(false)}>
              <Text style={[styles.closeButtonText, { fontSize: scaleFont(16) }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Navigation bar */}
      <View style={[styles.nav, { paddingVertical: verticalScale(12), borderTopLeftRadius: scale(15), borderTopRightRadius: scale(15) }]}>
        <TouchableOpacity onPress={() => router.push('/homepage')}>
          <Ionicons name="home" size={scaleFont(28)} color="#808080" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/cart')}>
          <Ionicons name="cart" size={scaleFont(28)} color="#808080" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person" size={scaleFont(28)} color="gray" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D50000' },
  backWrapper: { position: 'absolute', zIndex: 2 },
  title: { fontWeight: 'bold', color: 'white', textAlign: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  addButton: { backgroundColor: '#FFF3E0', alignItems: 'center' },
  savedButton: { backgroundColor: '#FFF3E0', alignItems: 'center' },
  addButtonText: { color: '#D50000', fontWeight: 'bold' },
  calendar: { backgroundColor: '#FFF3E0' },
  reminderList: { flex: 1, marginTop: verticalScale(10) },
  reminderTitle: { fontWeight: 'bold', color: '#D50000', textAlign: 'center', backgroundColor: '#FFF3E0' },
  noReminders: { color: '#888', textAlign: 'center', backgroundColor: '#FFF3E0' },
  reminderBox: { backgroundColor: '#FFF3E0' },
  reminderBoxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF3E0' },
  reminderText: { color: '#333' },
  nav: { position: 'absolute', bottom: verticalScale(30), left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderColor: '#ccc' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalContent: { backgroundColor: '#D50000', maxHeight: '80%' },
  modalTitle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  closeButton: { backgroundColor: '#FFF3E0', alignItems: 'center' },
  closeButtonText: { color: '#D50000', fontWeight: 'bold', textAlign: 'center' },
});
