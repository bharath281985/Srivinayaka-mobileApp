import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../app/theme';

const OrderSuccessScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✅</Text>
        </View>
        <Text style={[typography.h1, { textAlign: 'center', marginTop: 20 }]}>Order Placed!</Text>
        <Text style={styles.sub}>
          Your saree order has been successfully placed.{'\n'}You'll receive a confirmation soon.
        </Text>

        {orderId && (
          <View style={styles.orderIdBox}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderId}>#{orderId.slice(-10).toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          {['📦 Order confirmed & being processed', '🧵 Your saree will be carefully packed', '🚚 Shipped and on its way to you', '✅ Delivered to your doorstep'].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.navigate('OrderTracking', { orderId })}
          disabled={!orderId}
        >
          <Text style={styles.trackBtnText}>🚚 Track My Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, alignItems: 'center', paddingBottom: 40 },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    borderWidth: 3,
    borderColor: '#6ee7b7',
  },
  successIcon: { fontSize: 56 },
  sub: { color: colors.muted, textAlign: 'center', lineHeight: 22, marginTop: 10, marginBottom: 20 },
  orderIdBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    width: '100%',
    marginBottom: 16,
  },
  orderIdLabel: { fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  orderId: { fontWeight: '900', fontSize: 20, color: colors.text, marginTop: 4 },
  infoBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%',
    marginBottom: 20,
  },
  infoTitle: { fontWeight: '800', fontSize: 15, color: colors.text, marginBottom: 12 },
  stepRow: { paddingVertical: 6 },
  stepText: { color: colors.muted, fontSize: 14 },
  trackBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  trackBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  homeBtn: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: 13,
    alignItems: 'center',
    width: '100%',
  },
  homeBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
});

export default OrderSuccessScreen;
