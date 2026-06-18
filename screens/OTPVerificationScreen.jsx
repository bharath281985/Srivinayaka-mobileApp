import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, Platform, Dimensions } from 'react-native';
import { colors } from '../app/theme';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const { width } = Dimensions.get('window');

const OTPVerificationScreen = ({ route, navigation }) => {
  const phone = route.params?.phone || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const login = async () => {
    setLoading(true);
    try {
      // Direct API Verification (Matches Website Process)
      const { data } = await api.post('/api/users/verify-otp', { phone, otp });
      if (data.isNewUser) {
        navigation.navigate('CompleteProfile', { authData: data });
      } else {
        const { useAuthStore } = await import('../store/useAuthStore');
        const { login, postLoginRedirect, clearPostLoginRedirect } = useAuthStore.getState();
        await login({ token: data.token, user: data });
        const target = postLoginRedirect;
        clearPostLoginRedirect();
        if (target?.routeName) {
          navigation.getParent()?.navigate(target.routeName, target.params);
        } else {
          navigation.getParent()?.navigate('Main');
        }
      }
    } catch (e) {
      Alert.alert('Verification Failed', e.response?.data?.message || 'The code you entered is invalid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (timer === 0) {
      try {
        await api.post('/api/users/send-otp', { phone });
        setTimer(30);
        Alert.alert('OTP Resent', 'A new verification code has been sent to your phone.');
      } catch (e) {
        Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subTitle}>
            We've sent a 6-digit code to
            <Text style={styles.phoneText}> +91 {phone.startsWith('91') ? phone.slice(2) : phone}</Text>
          </Text>

          <View style={styles.otpContainer}>
            <TextInput
              style={styles.input}
              placeholder="0 0 0 0 0 0"
              placeholderTextColor="#d1d5db"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              autoFocus
            />
          </View>

          <TouchableOpacity
            onPress={login}
            disabled={loading || otp.length < 6}
            activeOpacity={0.8}
          >
            <View
              style={[styles.btn, (loading || otp.length < 6) && styles.btnDisabled]}
            >
              <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify & Login'}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Didn't receive code? </Text>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={resendOtp}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  content: { width: '100%' },
  title: { fontSize: 32, fontWeight: '900', color: '#111827', marginBottom: 12 },
  subTitle: { fontSize: 16, color: '#6b7280', lineHeight: 24, marginBottom: 40 },
  phoneText: { color: '#111827', fontWeight: '700' },

  otpContainer: {
    marginBottom: 32,
    alignItems: 'center'
  },
  input: {
    width: '100%',
    height: 70,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#111827'
  },

  btn: { borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.accent, fontWeight: '800', fontSize: 16, letterSpacing: 1 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#6b7280', fontSize: 14 },
  timerText: { color: '#9ca3af', fontWeight: '600', fontSize: 14 },
  resendLink: { color: colors.primaryLight, fontWeight: '800', fontSize: 14 },
});

export default OTPVerificationScreen;
