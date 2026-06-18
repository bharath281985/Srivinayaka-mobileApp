import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { inr } from '../utils/currency';
import { colors, spacing, radius, typography } from '../app/theme';
import { ErrorState } from '../components/States';
import { SkeletonBox } from '../components/SkeletonCard';
import { CANCELLED_STATUSES, ORDER_STATUSES, normalizeOrderStatus } from '../utils/constants';

const STATUS_STEPS = ORDER_STATUSES;

const StatusStep = ({ step, status }) => {
  const steps = STATUS_STEPS;
  const curIdx = steps.indexOf(normalizeOrderStatus(status));
  const stepIdx = steps.indexOf(step);
  const done = stepIdx <= curIdx;
  const active = stepIdx === curIdx;
  return (
    <View style={stepStyles.wrap}>
      <View style={[stepStyles.circle, done && stepStyles.circleDone, active && stepStyles.circleActive]}>
        <Text style={[stepStyles.circleText, done && stepStyles.circleTextDone]}>
          {done ? 'OK' : stepIdx + 1}
        </Text>
      </View>
      <Text style={[stepStyles.label, active && stepStyles.labelActive]}>{step}</Text>
    </View>
  );
};

const stepStyles = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  circleDone: { borderColor: colors.success, backgroundColor: colors.success },
  circleActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  circleText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  circleTextDone: { color: '#fff' },
  label: { fontSize: 9, color: colors.muted, textAlign: 'center' },
  labelActive: { color: colors.primary, fontWeight: '700' },
});

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/orders/${orderId}`);
      setOrder(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [orderId]);

  if (loading) {
    return (
      <View style={styles.wrap}>
        <SkeletonBox width="100%" height={180} style={{ borderRadius: 0 }} />
        <View style={{ padding: 16, gap: 10 }}>
          <SkeletonBox width="60%" height={14} />
          <SkeletonBox width="80%" height={12} />
        </View>
      </View>
    );
  }
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return null;

  let displayStatus = normalizeOrderStatus(order.orderStatus);

  let statusColor = {
    'Order Confirmed': '#f59e0b',
    'Order Packed': '#3b82f6',
    Shipped: '#06b6d4',
    'Out for Delivery': '#6366f1',
    Delivered: colors.success,
    Canceled: colors.danger,
    Returned: colors.muted,
  }[displayStatus] || colors.muted;

  if (!order.isPaid && order.paymentMethod === 'Online') {
    if (order.paymentResult?.status === 'userCancelled') {
      displayStatus = 'Cancelled by User';
      statusColor = '#f97316';
    } else if (order.paymentResult?.status === 'failure') {
      displayStatus = 'Payment Failed';
      statusColor = colors.danger;
    }
  }

  const getItemImage = (item) => item.variant?.imageUrl || item.image || '';
  const getVariantLabel = (item) => {
    const parts = [];
    if (item.variant?.color) parts.push(`Color: ${item.variant.color}`);
    if (item.variant?.size) parts.push(`Size: ${item.variant.size}`);
    if (item.variant?.sku) parts.push(`SKU: ${item.variant.sku}`);
    return parts.join(' • ');
  };

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Card */}
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderId}>#{order._id?.slice(-10)?.toUpperCase()}</Text>
              <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{displayStatus}</Text>
            </View>
          </View>

          {/* Status Stepper (only for non-cancelled orders) */}
          {!CANCELLED_STATUSES.includes(order.orderStatus) && (
            <View style={styles.stepper}>
              {STATUS_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  <StatusStep step={step} status={displayStatus} />
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[
                      styles.stepLine,
                      STATUS_STEPS.indexOf(displayStatus) > i && { backgroundColor: colors.success }
                    ]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦 Items Ordered</Text>
          {(order.orderItems || []).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Image
                source={getItemImage(item) ? { uri: getItemImage(item) } : 'https://via.placeholder.com/60'}
                style={styles.itemImg}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                {!!getVariantLabel(item) && <Text style={styles.variantMeta}>{getVariantLabel(item)}</Text>}
                <Text style={styles.itemMeta}>Qty: {item.qty}</Text>
                {item.hasFallPico && <Text style={styles.addon}>+ Fall & Pico</Text>}
                {item.hasUnderskirt && <Text style={styles.addon}>+ Underskirt</Text>}
              </View>
              <Text style={styles.itemPrice}>{inr(item.price * item.qty)}</Text>
            </View>
          ))}
        </View>

        {/* Shipping Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Shipping Address</Text>
          <Text style={styles.addrText}>
            {order.shippingAddress?.address},{'\n'}
            {order.shippingAddress?.city} - {order.shippingAddress?.postalCode},{'\n'}
            {order.shippingAddress?.country}
            {order.shippingAddress?.phone ? `\n📞 ${order.shippingAddress.phone}` : ''}
          </Text>
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💳 Payment Summary</Text>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>Items</Text><Text style={styles.priceVal}>{inr(order.itemsPrice || order.totalPrice)}</Text></View>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>Shipping</Text><Text style={[styles.priceVal, { color: colors.success }]}>{order.shippingPrice > 0 ? inr(order.shippingPrice) : 'Free'}</Text></View>
          <View style={[styles.priceRow, styles.totalPriceRow]}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalVal}>{inr(order.totalPrice)}</Text>
          </View>
          <Text style={styles.payMeta}>
            Payment: {order.paymentMethod} •{' '}
            {order.isPaid
              ? '✅ Paid'
              : order.paymentResult?.status === 'userCancelled'
                ? 'Cancelled by User'
                : order.paymentResult?.status === 'failure'
                  ? 'Payment Failed'
                  : '⏳ Pending'}
          </Text>
          {!order.isPaid &&
            order.paymentResult?.status_message &&
            !['NA', 'NULL', 'UNDEFINED', ''].includes(
              String(order.paymentResult.status_message).toUpperCase()
            ) && (
              <Text style={styles.statusMsg}>{order.paymentResult.status_message}</Text>
            )}
        </View>

        {/* Track Button */}
        <TouchableOpacity
          style={[
            styles.trackBtn,
            !order.isPaid && { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }
          ]}
          onPress={() => order.isPaid && navigation.navigate('OrderTracking', { orderId: order._id })}
          disabled={!order.isPaid}
        >
          <Text style={[styles.trackBtnText, !order.isPaid && { color: colors.muted }]}>
            {order.isPaid ? '🚚 Track This Order' : '❌ Tracking Unavailable'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontWeight: '800', fontSize: 16, color: colors.text },
  orderDate: { color: colors.muted, fontSize: 13, marginTop: 2 },
  statusBadge: { borderWidth: 1.5, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontWeight: '700', fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  stepLine: { flex: 0.5, height: 2, backgroundColor: colors.border, marginBottom: 22 },
  cardTitle: { fontWeight: '800', fontSize: 15, color: colors.text, marginBottom: 12 },
  itemRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.bg, alignItems: 'flex-start' },
  itemImg: { width: 56, height: 72, borderRadius: radius.sm },
  itemName: { fontWeight: '600', fontSize: 13, color: colors.text },
  variantMeta: { color: colors.muted, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },
  itemMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  addon: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  itemPrice: { fontWeight: '700', color: colors.primary, minWidth: 60, textAlign: 'right' },
  addrText: { color: colors.muted, lineHeight: 22 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  priceLabel: { color: colors.muted },
  priceVal: { fontWeight: '600', color: colors.text },
  totalPriceRow: { borderTopWidth: 1, borderColor: colors.border, marginTop: 6, paddingTop: 8 },
  totalLabel: { fontWeight: '800', fontSize: 15 },
  totalVal: { fontWeight: '900', fontSize: 17, color: colors.primary },
  payMeta: { color: colors.muted, fontSize: 12, marginTop: 8 },
  trackBtn: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  trackBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  statusMsg: { fontSize: 12, color: colors.muted, marginTop: 4, fontStyle: 'italic' },
});

export default OrderDetailsScreen;
