import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cachedGet, getProducts, getImageUrl } from '../services/api';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import SkeletonCard from '../components/SkeletonCard';
import { colors, spacing, radius, typography } from '../app/theme';

const { width: SW } = Dimensions.get('window');

const SubcategoryListingScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { categoryId, title } = route.params || {};
  const [subCats, setSubCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Animation values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const railAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Load Level 2 Categories (Subcategories)
      const subData = await cachedGet('/api/categories', 30000, {
        params: { level: 2, parent: categoryId },
      });
      setSubCats(subData);

      // Load Products of this Category (Level 1 category filter)
      const prodResult = await getProducts({ category: categoryId }, 10000);
      setProducts(prodResult.products || []);
      
      // Trigger animations
      Animated.sequence([
          Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(railAnim, { toValue: 1, duration: 600, useNativeDriver: true })
      ]).start();

    } catch (e) {
      setError('Something went wrong curated our gallery. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonRail}>
          {[1, 2, 3, 4].map(i => <View key={i} style={styles.skeletonCircle} />)}
        </View>
        <View style={styles.skeletonGrid}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={products}
        keyExtractor={(p) => p._id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollList, { paddingBottom: Math.max(insets.bottom, 60) }]}
        ListHeaderComponent={
          <>
            {/* Elegant Header Panel */}
            <Animated.View style={[styles.topSection, { opacity: headerAnim, paddingTop: 20 }]}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catTitle}>{title?.toUpperCase() || 'COLLECTION'}</Text>
                  <Text style={styles.itemsCount}>{products.length} MASTERPIECES AVAILABLE</Text>
                </View>
              </View>
            </Animated.View>

            {/* Sub-Collection Rail */}
            {subCats.length > 0 && (
              <Animated.View style={[styles.railSection, { opacity: railAnim }]}>
                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitleLabel}>SELECT STYLE</Text>
                    <View style={styles.headLine} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
                  {subCats.map((sub) => (
                    <TouchableOpacity
                      key={sub._id}
                      style={styles.subCard}
                      onPress={() => navigation.navigate('ProductListing', { subCategoryId: sub._id, title: sub.name })}
                    >
                      <View style={styles.subImgContainer}>
                        <Image
                          source={{ uri: getImageUrl(sub.mobileBannerImage || sub.image) || 'https://via.placeholder.com/300x400' }}
                          style={styles.subImg}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
                        <Text style={styles.subLabel}>{sub.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            <Animated.View style={[styles.gridHeading, { opacity: headerAnim }]}>
              <Text style={styles.luxeHeading}>ALL DESIGNS</Text>
              <View style={styles.headLine} />
            </Animated.View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading && products.length === 0 && (
            <EmptyState
              title="Coming Soon"
              subtitle="Our refined gallery for this category is currently being curated."
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollList: { paddingBottom: 60 },

  topSection: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8f9fa',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f1f1'
  },
  backEmoji: { fontSize: 18, color: '#111' },
  catTitle: { fontSize: 24, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  itemsCount: { fontSize: 10, fontWeight: '800', color: colors.primaryLight, marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' },

  railSection: { marginTop: 12, paddingHorizontal: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitleLabel: { fontSize: 11, fontWeight: '900', color: '#111', letterSpacing: 2 },
  railContent: { paddingRight: 40, gap: 12, paddingBottom: 10 },
  subCard: { width: 140, height: 180, borderRadius: 24, overflow: 'hidden' },
  subImgContainer: { flex: 1, position: 'relative', borderRadius: 24, overflow: 'hidden' },
  subImg: { width: '100%', height: '100%' },
  subLabel: {
    position: 'absolute', bottom: 16, left: 16, right: 16, color: '#fff',
    fontSize: 14, fontWeight: '800', letterSpacing: 0.5
  },

  gridHeading: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    marginTop: 32, marginBottom: 16
  },
  luxeHeading: { fontSize: 11, fontWeight: '900', color: '#111', letterSpacing: 2 },
  headLine: { flex: 1, height: 1, backgroundColor: '#f1f1f1', marginLeft: 16 },

  cardWrapper: { flex: 1, paddingHorizontal: 8, marginBottom: 16 },

  loadWrap: { flex: 1, backgroundColor: '#fff', padding: 20 },
  skeletonHeader: { width: '60%', height: 32, backgroundColor: '#f5f5f5', borderRadius: 8, marginTop: 40, marginBottom: 30 },
  skeletonRail: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  skeletonCircle: { width: 120, height: 160, borderRadius: 20, backgroundColor: '#f5f5f5' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});

export default SubcategoryListingScreen;
