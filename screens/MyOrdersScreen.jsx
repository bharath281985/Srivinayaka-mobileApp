import React, { useEffect, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { inr } from '../utils/currency';
import { EmptyState, ErrorState } from '../components/States';
import { SkeletonBox } from '../components/SkeletonCard';
import { colors, spacing, radius, typography } from '../app/theme';
import { normalizeOrderStatus } from '../utils/constants';

const STATUS_COLOR = {
  'Order Confirmed': '#f59e0b',
  'Order Packed': '#3b82f6',
  Shipped: '#06b6d4',
  'Out for Delivery': '#6366f1',
  'Ready to Pickup': '#6366f1',
  Delivered: '#15803d',
  Canceled: '#b91c1c',
  Returned: '#6b7280',
};

const MyOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (refresh = false) => {
    if (!refresh) setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/orders/myorders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load your orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const getItemImage = (item) => item.variant?.imageUrl || item.image || '';

  if (loading) {
    return (
      <View style={styles.wrap}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} width="100%" height={80} style={{ borderRadius: radius.lg, marginBottom: 10, marginHorizontal: spacing.md }} />
        ))}
      </View>
    );
  }

  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  if (!orders.length) {
    return (
      <EmptyState
        icon="📦"
        title="No orders yet"
        subtitle="Your placed orders will appear here."
        actionText="Start Shopping"
        onAction={() => navigation.navigate('Home')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <Text style={[typography.h2, { marginBottom: 14 }]}>My Orders ({orders.length})</Text>
        }
        renderItem={({ item }) => {
          let displayStatus = normalizeOrderStatus(item.orderStatus);
          let statusCol = STATUS_COLOR[displayStatus] || colors.muted;

          if (!item.isPaid && item.paymentMethod === 'Online') {
            if (item.paymentResult?.status === 'userCancelled') {
              displayStatus = 'Cancelled by User';
              statusCol = '#f97316';
            } else if (item.paymentResult?.status === 'failure') {
              displayStatus = 'Payment Failed';
              statusCol = '#b91c1c';
            } else {
              displayStatus = 'Unpaid';
              statusCol = '#d97706';
            }
          }

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.orderId}>#{item._id.slice(-10).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusCol + '20', borderColor: statusCol }]}>
                  <Text style={[styles.statusText, { color: statusCol }]}>{displayStatus}</Text>
                </View>
              </View>

              {/* Product Thumbnails Row */}
              <View style={styles.imageRow}>
                {item.orderItems?.slice(0, 4).map((orderItem, idx) => (
                  <Image
                    key={idx}
                    source={getItemImage(orderItem) ? { uri: getItemImage(orderItem) } : 'https://via.placeholder.com/60'}
                    style={styles.thumbnail}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ))}
                {item.orderItems?.length > 4 && (
                  <View style={styles.moreBadge}>
                    <Text style={styles.moreText}>+{item.orderItems.length - 4}</Text>
                  </View>
                )}
              </View>

              {(!item.isPaid && item.paymentResult?.status_message && !['NA', 'NULL', 'UNDEFINED', ''].includes(String(item.paymentResult.status_message).toUpperCase())) && (
                <Text style={styles.statusMsg} numberOfLines={1}>{item.paymentResult.status_message}</Text>
              )}
              <View style={styles.cardBottom}>
                <Text style={styles.itemCount}>{item.orderItems?.length || 0} item(s)</Text>
                <Text style={styles.total}>{inr(item.totalPrice)}</Text>
              </View>
              <Text style={styles.tapHint}>Tap for details & tracking →</Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontWeight: '800', fontSize: 15, color: colors.text },
  orderDate: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statusBadge: { borderWidth: 1.5, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontWeight: '700', fontSize: 12 },
  imageRow: { flexDirection: 'row', marginTop: 14, gap: 10, alignItems: 'center' },
  thumbnail: { width: 50, height: 64, borderRadius: radius.md, borderWidth: 1, borderColor: colors.bg },
  moreBadge: { 
    width: 50, 
    height: 64, 
    borderRadius: radius.md, 
    backgroundColor: colors.bg, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  moreText: { color: colors.muted, fontSize: 14, fontWeight: '800' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  itemCount: { color: colors.muted, fontSize: 13 },
  total: { fontWeight: '800', fontSize: 15, color: colors.primary },
  tapHint: { color: colors.muted, fontSize: 11, marginTop: 8 },
  statusMsg: { fontSize: 11, color: colors.muted, marginTop: 4, fontStyle: 'italic' },
});


export default MyOrdersScreen;
