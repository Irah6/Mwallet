import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

export default function OTPScreen() {
  const [otp, setOtp] = useState('');
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const handleVerify = () => {
    if (otp === '1111') {
      router.replace('/(tabs)');
    } else {
      alert('Invalid OTP. Please try again.');
      setOtp('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to {phone}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="••••"
          placeholderTextColor="#555"
          keyboardType="number-pad"
          maxLength={4}
          value={otp}
          onChangeText={setOtp}
          autoFocus
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleVerify}>
          <Text style={styles.buttonText}>Verify & Proceed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center' },
  innerContainer: { paddingHorizontal: 25, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#aaa', marginBottom: 40, textAlign: 'center' },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 20,
    borderRadius: 10,
    fontSize: 24,
    width: '80%',
    textAlign: 'center',
    letterSpacing: 20,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});