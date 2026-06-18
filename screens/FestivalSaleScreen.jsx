import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { cachedGet } from '../services/api';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorState } from '../components/States';
import SkeletonCard from '../components/SkeletonCard';
import { colors, spacing, typography } from '../app/theme';

const FestivalSaleScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cachedGet('/api/products', 10000, {
        params: { bestSeller: 'true', limit: 40 },
      });
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError('Unable to load bestseller items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={[styles.wrap, styles.loadWrap]}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </View>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!products.length) {
    return <EmptyState icon="*" title="No bestseller items" subtitle="Add bestseller products from admin to show them here." />;
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Bestseller</Text>
              <Text style={styles.bannerSub}>Products marked as bestseller in admin</Text>
            </View>
            <Text style={[typography.h3, { marginBottom: 14 }]}>All Bestseller Items</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  loadWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: spacing.md },
  list: { padding: spacing.md, gap: 10 },
  banner: {
    backgroundColor: '#fff4f2',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  bannerText: { fontSize: 22, fontWeight: '900', color: colors.primary },
  bannerSub: { color: colors.muted, marginTop: 4 },
});

export default FestivalSaleScreen;
