import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();

  const handleContinue = () => {
    if (phoneNumber.length > 5) {
      router.push({ pathname: '/otp', params: { phone: phoneNumber } });
    } else {
      alert('Please enter a valid phone number.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <Text style={styles.title}>mwallet</Text>
            <Text style={styles.subtitle}>Connect your world of finance.</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter your phone number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  keyboardView: { flex: 1 },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  title: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#aaa', marginBottom: 60, textAlign: 'center' },
  inputContainer: { width: '100%', marginBottom: 30 },
  inputLabel: { color: '#aaa', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});