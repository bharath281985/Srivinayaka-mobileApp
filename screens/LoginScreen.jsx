import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../app/theme';
import api from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const sendOtp = async () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      // Add 91 in the app
      const fullPhone = '91' + cleanPhone;
      await api.post('/api/users/send-otp', { phone: fullPhone });
      navigation.navigate('OTPVerification', { phone: fullPhone });
    } catch (e) {
      const msg = e.response?.data?.message || 'Unable to send OTP';
      Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.headerRow}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo} 
              contentFit="contain" 
            />
            <View style={styles.headerText}>
              <Text style={styles.title}>Login</Text>
              <Text style={styles.subTitle}>Enter your valid mobile number</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(value) => setPhone(value.replace(/[^0-9]/g, ''))}
              maxLength={10}
            />
          </View>

          <TouchableOpacity
            onPress={sendOtp}
            disabled={loading || phone.length < 10}
            activeOpacity={0.85}
            style={[styles.btn, (loading || phone.length < 10) && styles.btnDisabled]}
          >
            <Text style={[styles.btnText, (loading || phone.length < 10) && styles.btnTextDisabled]}>
              {loading ? 'Sending OTP...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.04)' },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 20,
  },
  logo: {
    width: 130,
    height: 100,
  },
  headerText: {
    flex: 1,
    marginLeft: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'left',
    marginBottom: 2,
  },
  subTitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 58,
    marginBottom: 18,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 14,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
    paddingRight: 14,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#111827',
    fontWeight: '600',
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: '#e5e7eb',
  },
  btnText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 16,
  },
  btnTextDisabled: {
    color: '#9ca3af',
  },
});

export default LoginScreen;
