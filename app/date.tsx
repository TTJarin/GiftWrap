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
import { scale, verticalScale, scaleFont } from './scale'; // <- scaling utility

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
      if (err instanceof Error) Alert.alert('Error', err.message);
      else Alert.alert('Error', 'Failed to save reminder');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? verticalScale(100) : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.wrapper}>
          <ScrollView
            contentContainerStyle={[styles.container, { paddingBottom: verticalScale(200) }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Arrow */}
            <TouchableOpacity onPress={() => router.replace('/profile')} style={[styles.backWrapper, { top: verticalScale(80), left: scale(20) }]}>
              <Ionicons name="arrow-back" size={scaleFont(28)} color="white" />
            </TouchableOpacity>

            <Text style={[styles.title, { fontSize: scaleFont(26), marginBottom: verticalScale(40) }]}>My Dates</Text>

            <Text style={[styles.label, { marginBottom: verticalScale(8) }]}>Event Name</Text>
            <TextInput
              style={[styles.input, { padding: verticalScale(12), marginBottom: verticalScale(16), borderRadius: scale(10) }]}
              value={eventName}
              onChangeText={setEventName}
              placeholder="e.g. Birthday of Ammu"
              placeholderTextColor="#999"
            />
            {errors.eventName && <Text style={styles.errorText}>{errors.eventName}</Text>}

            <Text style={[styles.label, { marginBottom: verticalScale(8) }]}>Day</Text>
            <TextInput
              style={[styles.input, { padding: verticalScale(12), marginBottom: verticalScale(16), borderRadius: scale(10) }]}
              value={day}
              onChangeText={setDay}
              placeholder="DD"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={2}
            />
            {errors.day && <Text style={styles.errorText}>{errors.day}</Text>}

            <Text style={[styles.label, { marginBottom: verticalScale(8) }]}>Month</Text>
            <TextInput
              style={[styles.input, { padding: verticalScale(12), marginBottom: verticalScale(16), borderRadius: scale(10) }]}
              value={month}
              onChangeText={setMonth}
              placeholder="MM"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={2}
            />
            {errors.month && <Text style={styles.errorText}>{errors.month}</Text>}

            <Text style={[styles.label, { marginBottom: verticalScale(8) }]}>Year</Text>
            <TextInput
              style={[styles.input, { padding: verticalScale(12), marginBottom: verticalScale(16), borderRadius: scale(10) }]}
              value={year}
              onChangeText={setYear}
              placeholder="YYYY"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={4}
            />
            {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}

            <TouchableOpacity style={[styles.button, { padding: verticalScale(15), borderRadius: scale(10), marginTop: verticalScale(20) }]} onPress={handleSetReminder}>
              <Text style={[styles.buttonText, { fontSize: scaleFont(16) }]}>Set Reminder</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Custom Bottom Nav */}
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
    paddingTop: verticalScale(70),
    paddingHorizontal: scale(20),
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backWrapper: {
    position: 'absolute',
    zIndex: 2,
  },
  label: {
    color: '#FFF3E0',
  },
  input: {
    backgroundColor: '#FFF3E0',
    color: '#000',
  },
  button: {
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#D50000',
  },
  nav: {
    position: 'absolute',
    bottom: verticalScale(30),
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  errorText: {
    color: '#fff',
    backgroundColor: '#D50000',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(8),
    marginBottom: verticalScale(8),
    fontSize: scaleFont(13),
  },
});
