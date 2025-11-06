import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { db } from '../firebaseConfig';

interface Errors {
  eventName?: string;
  day?: string;
  month?: string;
  year?: string;
}

export default function MyDatesScreen() {
  const router = useRouter();

  const [eventName, setEventName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const handleSetReminder = async () => {
    const newErrors: Errors = {};
    if (!eventName) newErrors.eventName = 'Event name is required';
    if (!day) newErrors.day = 'Day is required';
    if (!month) newErrors.month = 'Month is required';
    if (!year) newErrors.year = 'Year is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');

      const dayStr = day.padStart(2, '0');
      const monthStr = month.padStart(2, '0');
      const dateString = `${year}-${monthStr}-${dayStr}`;

      await addDoc(collection(db, 'reminders'), {
        userId: user.uid,
        title: eventName,
        date: dateString,
        day: dayStr,
        month: monthStr,
        recurrence: 'yearly',
        createdAt: new Date(),
      });

      Alert.alert('Reminder set', `"${eventName}" on ${dateString}`);
      setEventName('');
      setDay('');
      setMonth('');
      setYear('');
      setErrors({});
      router.replace('/calendar');
    } catch (err: unknown) {
      if (err instanceof Error) {
        Alert.alert('Error', err.message);
      } else {
        Alert.alert('Error', 'Failed to save reminder');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.wrapper}>
          <ScrollView
            contentContainerStyle={[styles.container, { paddingBottom: 200 }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backWrapper}>
              <Text style={styles.back}>{'< Back'}</Text>
            </TouchableOpacity>

            <Text style={styles.title}>My Dates</Text>

            <Text style={styles.label}>Event Name</Text>
            <TextInput
              style={styles.input}
              value={eventName}
              onChangeText={setEventName}
              placeholder="e.g. Birthday of Ammu"
              placeholderTextColor="#999"
            />
            {errors.eventName && <Text style={styles.errorText}>{errors.eventName}</Text>}

            <Text style={styles.label}>Day</Text>
            <TextInput
              style={styles.input}
              value={day}
              onChangeText={setDay}
              placeholder="DD"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={2}
            />
            {errors.day && <Text style={styles.errorText}>{errors.day}</Text>}

            <Text style={styles.label}>Month</Text>
            <TextInput
              style={styles.input}
              value={month}
              onChangeText={setMonth}
              placeholder="MM"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={2}
            />
            {errors.month && <Text style={styles.errorText}>{errors.month}</Text>}

            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              placeholder="YYYY"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={4}
            />
            {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}

            <TouchableOpacity style={styles.button} onPress={handleSetReminder}>
              <Text style={styles.buttonText}>Set Reminder</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Custom Bottom Nav */}
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
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#D50000',
  },
  container: {
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  backWrapper: {
    position: 'absolute',
    top: 30,
    left: 20,
    zIndex: 2,
  },
  back: {
    color: 'white',
    fontSize: 16,
  },
  label: {
    color: '#FFF3E0',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#D50000',
    fontSize: 16,
  },
  nav: {
    position: 'absolute',
    bottom: 16, // above system nav bar
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  errorText: {
    color: '#fff',
    backgroundColor: '#D50000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 13,
  },
});
