import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { colors, spacing, radius, typography } from '../app/theme';
import { ErrorState } from '../components/States';
import { SkeletonBox } from '../components/SkeletonCard';
import { inr } from '../utils/currency';
import { CANCELLED_STATUSES, ORDER_STATUSES, PICKUP_ORDER_STATUSES, normalizeOrderStatus } from '../utils/constants';

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/orders/track/${orderId}`);
      setTrack(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Tracking info unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.wrap}>
        <SkeletonBox width="100%" height={200} style={{ borderRadius: 0 }} />
      </View>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  const displayStatus = normalizeOrderStatus(track?.orderStatus);
  const isPickup = track?.shippingMethod === 'Store Pickup' || track?.shippingMethod === 'Delivery By Rapido' || /rapido/i.test(track?.shippingMethod || '');
  const statusSteps = isPickup ? PICKUP_ORDER_STATUSES : ORDER_STATUSES;
  const currentIdx = statusSteps.indexOf(displayStatus);
  const isCancelled = CANCELLED_STATUSES.includes(track?.orderStatus);
  const stepDescriptions = isPickup
    ? [
        'Your order has been placed.',
        'Your order has been packed.',
        'Your order is ready for pickup / Rapido dispatch.',
        'Your order has been collected / delivered.',
      ]
    : [
        'Your order has been placed.',
        'Your order has been packed.',
        'Your order has been shipped.',
        `Your order is out for delivery to ${track?.shippingAddress?.city || 'your address'}.`,
        'Your order has been delivered.',
      ];

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.orderId}>#{track?._id?.slice(-10)?.toUpperCase()}</Text>
          <Text style={styles.sub}>
            Placed on {new Date(track?.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <View style={styles.infoRow}>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillLabel}>Total</Text>
              <Text style={styles.infoPillVal}>{inr(track?.totalPrice)}</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillLabel}>Payment</Text>
              <Text style={[styles.infoPillVal, { color: track?.isPaid ? colors.success : colors.danger }]}>
                {track?.isPaid ? 'Paid' : 'Pending'}
              </Text>
            </View>
            {track?.shippingAddress?.city && (
              <View style={styles.infoPill}>
                <Text style={styles.infoPillLabel}>Delivery To</Text>
                <Text style={styles.infoPillVal}>{track.shippingAddress.city}</Text>
              </View>
            )}
          </View>
        </View>

        {isCancelled ? (
          <View style={[styles.card, { borderWidth: 2, borderColor: colors.danger }]}>
            <Text style={[typography.h3, { color: colors.danger, textAlign: 'center' }]}>
              Order {displayStatus}
            </Text>
            <Text style={[styles.sub, { textAlign: 'center', marginTop: 6 }]}>
              Please contact support if you have questions.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tracking Progress</Text>
            {statusSteps.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[styles.stepCircle, done && styles.stepCircleDone, active && styles.stepCircleActive]}>
                      <Text style={styles.stepIcon}>{done ? 'OK' : i + 1}</Text>
                    </View>
                    {i < statusSteps.length - 1 && (
                      <View style={[styles.stepConnector, done && i < currentIdx && styles.stepConnectorDone]} />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, active && { color: colors.primary, fontWeight: '800' }]}>{step}</Text>
                    {active && <Text style={styles.stepDesc}>{stepDescriptions[i]}</Text>}
                    {active && (
                      <View style={styles.activePill}>
                        <Text style={styles.activePillText}>Current Status</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => navigation.navigate('OrderDetails', { orderId })}
        >
          <Text style={styles.detailBtnText}>View Full Order Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md },
  label: { fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  orderId: { fontWeight: '900', fontSize: 22, color: colors.text, marginTop: 2 },
  sub: { color: colors.muted, fontSize: 13, marginTop: 4 },
  infoRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  infoPill: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    padding: 10,
    alignItems: 'center',
  },
  infoPillLabel: { fontSize: 10, color: colors.muted, textTransform: 'uppercase' },
  infoPillVal: { fontWeight: '800', fontSize: 14, color: colors.text, marginTop: 2 },
  cardTitle: { fontWeight: '800', fontSize: 15, color: colors.text, marginBottom: 16 },
  stepRow: { flexDirection: 'row', gap: 14, marginBottom: 4 },
  stepLeft: { alignItems: 'center' },
  stepCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: { borderColor: colors.success, backgroundColor: '#ecfdf5' },
  stepCircleActive: { borderColor: colors.primary, backgroundColor: '#fff4f2' },
  stepIcon: { fontSize: 16, fontWeight: '700' },
  stepConnector: { width: 2, flex: 1, minHeight: 28, backgroundColor: colors.border, marginVertical: 2 },
  stepConnectorDone: { backgroundColor: colors.success },
  stepContent: { flex: 1, paddingBottom: 20 },
  stepTitle: { fontWeight: '600', fontSize: 15, color: colors.muted, marginTop: 8 },
  stepDesc: { color: colors.muted, fontSize: 13, marginTop: 4, lineHeight: 19 },
  activePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff4f2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  activePillText: { color: colors.primary, fontWeight: '700', fontSize: 11 },
  detailBtn: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  detailBtnText: { color: '#fff', fontWeight: '700' },
});

export default OrderTrackingScreen;
