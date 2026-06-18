import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import { EmptyState, ErrorState } from '../components/States';
import { colors, spacing, radius, typography } from '../app/theme';

const ProductListingScreen = ({ route, navigation }) => {
  const {
    categoryId,
    subCategoryId,
    childCategoryId,
    title,
    query,
    featured,
    trending,
    newArrival,
    bestSeller,
    maxPrice,
  } = route.params || {};

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('newest');

  const PAGE_SIZE = 20;

  const buildParams = (pg, sortVal) => ({
    page: pg,
    limit: PAGE_SIZE,
    sort: sortVal,
    ...(categoryId ? { category: categoryId } : {}),
    ...(subCategoryId ? { subCategory: subCategoryId } : {}),
    ...(childCategoryId ? { childCategory: childCategoryId } : {}),
    ...(query ? { q: query } : {}),
    ...(featured ? { featured: 'true' } : {}),
    ...(trending ? { trending: 'true' } : {}),
    ...(newArrival ? { newArrival: 'true' } : {}),
    ...(bestSeller ? { bestSeller: 'true' } : {}),
    ...(maxPrice ? { maxPrice } : {}),
  });

  const load = useCallback(
    async (pg = 1, append = false, sortVal = sort, refresh = false) => {
      if (!append) setLoading(true);
      setError('');
      try {
        const result = await getProducts(buildParams(pg, sortVal), refresh ? 0 : 10000);

        setProducts((prev) => (append ? [...prev, ...result.products] : result.products));
        setPage(result.page);
        setPages(result.pages);
        setTotal(result.total);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load products.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [categoryId, subCategoryId, query, featured, trending, newArrival, bestSeller, sort]
  );

  useEffect(() => { load(1, false, sort); }, [categoryId, subCategoryId, query, sort, load]);

  const onRefresh = () => { setRefreshing(true); load(1, false, sort, true); };
  const onEndReached = () => { if (!loading && page < pages) load(page + 1, true, sort); };

  const openFilter = () => {
    navigation.navigate('Filter', {
      onApply: ({ sort: newSort }) => {
        setSort(newSort);
        load(1, false, newSort);
      },
    });
  };

  if (loading && !refreshing && !products.length) {
    return (
      <View style={styles.loadWrap}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </View>
    );
  }

  if (error && !products.length) return <ErrorState message={error} onRetry={() => load(1)} />;

  if (!products.length && !loading) {
    return (
      <EmptyState
        icon="🧵"
        title="No products found"
        subtitle={query ? `No results for "${query}". Try a different search.` : 'This category has no products yet.'}
      />
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={{ gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h2}>{title || 'Products'}</Text>
              {total > 0 && <Text style={styles.totalText}>{total} items found</Text>}
            </View>
            <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
              <Text style={styles.filterText}>⚙️ Sort</Text>
            </TouchableOpacity>
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
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && products.length > 0 ? (
            <ActivityIndicator color={colors.primary} style={{ padding: 20 }} />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: 10 },
  loadWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: spacing.md, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  totalText: { fontSize: 12, color: colors.muted, marginTop: 2 },
  filterBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterText: { color: colors.text, fontWeight: '600', fontSize: 13 },
});

export default ProductListingScreen;
