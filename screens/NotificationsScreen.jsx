import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cachedGet } from '../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { colors, spacing, radius, typography } from '../app/theme';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async (refresh = false) => {
    if (!refresh) setLoading(true);
    setError('');
    try {
      const data = await cachedGet('/api/app-management/notifications-inbox', refresh ? 0 : 30000);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setError('Unable to fetch notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && !refreshing) return <LoadingState />;
  if (error && !notifications.length) return <ErrorState message={error} onRetry={() => load()} />;

  if (!notifications.length) {
    return (
      <EmptyState
        icon="🔔"
        title="No notifications yet"
        subtitle="You'll see alerts, offers and updates here."
      />
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        ListHeaderComponent={<Text style={[typography.h2, { marginBottom: 14 }]}>Notifications</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</Text>
            </View>
            <Text style={styles.body}>{item.message}</Text>
            {item.redirectType !== 'None' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>New {item.redirectType}</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontWeight: '700', fontSize: 14, color: colors.text, flex: 1 },
  body: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  time: { color: colors.muted, fontSize: 10 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#fff4f2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 8 },
  badgeText: { fontSize: 9, color: colors.primary, fontWeight: '700', textTransform: 'uppercase' },
});

export default NotificationsScreen;
