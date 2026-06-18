import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { colors, spacing, radius, typography } from '../app/theme';
import { inr } from '../utils/currency';
import { useAppStore } from '../store/useAppStore';

const ApplyCouponScreen = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const cartTotals = useAppStore((s) => s.cartTotals);
  const { itemsPrice } = cartTotals();

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/api/coupons/validate', {
        code: code.trim().toUpperCase(),
        orderAmount: itemsPrice,
      });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid or expired coupon.');
    } finally {
      setLoading(false);
    }
  };

  const discount = result
    ? result.discountType === 'percent'
      ? (itemsPrice * result.discountValue) / 100
      : result.discountValue
    : 0;

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.h2, { marginBottom: spacing.md }]}>Apply Coupon</Text>

        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Enter coupon code"
            value={code}
            onChangeText={(t) => { setCode(t.toUpperCase()); setError(''); setResult(null); }}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={apply}
            disabled={loading || !code.trim()}
          >
            <Text style={styles.btnText}>{loading ? '…' : 'Apply'}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>❌ {error}</Text> : null}

        {result && (
          <View style={styles.successCard}>
            <Text style={styles.successCode}>✅ {result.code}</Text>
            <Text style={styles.successDesc}>
              {result.discountType === 'percent'
                ? `${result.discountValue}% discount applied`
                : `${inr(result.discountValue)} flat discount`}
            </Text>
            <Text style={styles.saving}>You save: {inr(discount)}</Text>
            {result.minOrderAmount > 0 && (
              <Text style={styles.subNote}>Min order: {inr(result.minOrderAmount)}</Text>
            )}
            {result.expiryDate && (
              <Text style={styles.subNote}>
                Valid till: {new Date(result.expiryDate).toLocaleDateString('en-IN')}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800' },
  errorText: { color: colors.danger, fontWeight: '600', marginTop: 4 },
  successCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#6ee7b7',
  },
  successCode: { fontWeight: '800', fontSize: 18, color: colors.success },
  successDesc: { color: colors.text, marginTop: 6 },
  saving: { fontWeight: '800', fontSize: 20, color: colors.success, marginTop: 8 },
  subNote: { color: colors.muted, fontSize: 12, marginTop: 4 },
});

export default ApplyCouponScreen;
