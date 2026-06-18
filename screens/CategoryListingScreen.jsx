import React, { useEffect, useState, useRef } from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cachedGet, getImageUrl } from '../services/api';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { colors, spacing, radius, typography } from '../app/theme';

const { width: SW } = Dimensions.get('window');

const AnimatedCard = ({ item, index, navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay: index * 100,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY }] }}>
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('SubcategoryListing', { categoryId: item._id, title: item.name })}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: getImageUrl(item.mobileBannerImage || item.image) || 'https://via.placeholder.com/300x400?text=Saree' }}
                        style={styles.image}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.gradient}
                    />
                    <View style={styles.textOverlay}>
                        <Text style={styles.catName}>{item.name}</Text>
                        <Text style={styles.catCount}>EXPLORE →</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const CategoryListingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await cachedGet('/api/categories', 30000, { params: { level: 1, showInMobile: true } });
      setItems(data);
    } catch (e) {
      setError('Unable to load our collection categories. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  if (!items.length) {
    return (
      <EmptyState
        title="Coming Soon"
        subtitle="Our exquisite collection categories are being curated. Please check back shortly."
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.wrap}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 40) }]}
        data={items}
        numColumns={2}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerLabel}>CURATED COLLECTIONS</Text>
            <Text style={styles.headerTitle}>SHOP BY CATEGORIES</Text>
            <View style={styles.line} />
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedCard item={item} index={index} navigation={navigation} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  wrap: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { marginTop: 32, marginBottom: 24, paddingHorizontal: 6 },
  headerLabel: { fontSize: 9, fontWeight: '900', color: colors.primaryLight, letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1a1410', letterSpacing: -0.5 },
  line: { width: 30, height: 2, backgroundColor: '#1a1410', marginTop: 12, borderRadius: 2 },

  card: {
    flex: 1,
    height: 260,
    margin: 6,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#f1f1f1',
  },
  imageContainer: { flex: 1 },
  image: { width: '100%', height: '100%' },
  gradient: { ...StyleSheet.absoluteFillObject },

  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  catName: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  catCount: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', marginTop: 6, letterSpacing: 1 },
});

export default CategoryListingScreen;
