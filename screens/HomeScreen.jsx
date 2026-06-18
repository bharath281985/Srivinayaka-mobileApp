import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { cachedGet, getImageUrl } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';
import BannerCarousel from '../components/BannerCarousel';
import SkeletonCard, { SkeletonBox } from '../components/SkeletonCard';
import { ErrorState } from '../components/States';
import { colors, spacing, radius, typography } from '../app/theme';

const { width: SW } = Dimensions.get('window');

// Map backend icon names (Lucide) to emoji so we never show raw text like "CheckCircle" or "Award"
const BRAND_VALUE_ICONS = {
  ShieldCheck: '🛡️',
  Wind: '🌬️',
  Truck: '🚚',
  RefreshCcw: '🔄',
  CheckCircle: '✓',
  Award: '🏆',
  Sparkles: '✨',
  Heart: '❤️',
  Shield: '🛡️',
};
const getBrandValueIcon = (icon) => {
  if (!icon || typeof icon !== 'string') return '✨';
  const trimmed = icon.trim();
  if (BRAND_VALUE_ICONS[trimmed]) return BRAND_VALUE_ICONS[trimmed];
  // Already an emoji (short or single char)
  if (trimmed.length <= 4 && !/^[A-Za-z]+$/.test(trimmed)) return trimmed;
  return '✨';
};

const FadeInView = ({ children, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [home, setHome] = useState({});

  const settings = home.settings || {};
  // Use same logo as website (bundled asset), not backend logo
  const logoSource = require('../assets/logo.png');

  const dynamicSections = [
    { key: 'newArrivals', label: 'NEW ARRIVAL', route: 'ProductListing', routeParams: { newArrival: 'true', title: 'New Arrival' } },
    { key: 'weekendSale', label: 'WEEKEND SALE', route: 'ProductListing', routeParams: { weekendSale: 'true', title: 'Weekend Sale' } },
    { key: 'regularCollections', label: 'REGULAR COLLECTIONS', route: 'ProductListing', routeParams: { title: 'Regular Collections' } },
    { key: 'featured', label: 'FESTIVE COLLECTIONS', route: 'ProductListing', routeParams: { featured: 'true', title: 'Festive Collections' } },
    { key: 'trending', label: 'TRENDING', route: 'ProductListing', routeParams: { trending: 'true', title: 'Trending' } },
    { key: 'bestSeller', label: 'BESTSELLER', route: 'ProductListing', routeParams: { bestSeller: 'true', title: 'Bestseller' } },
  ];

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  const load = async (refresh = false) => {
    if (!refresh) setLoading(true);
    setError('');
    try {
      const [data, bannerRes, weekendRes, regularRes] = await Promise.all([
        cachedGet('/api/app-management/mobile-home', refresh ? 0 : 30000),
        api.get('/api/banners'),
        api.get('/api/products?weekendSale=true&limit=8'),
        api.get('/api/products?regularCollection=true&limit=8')
      ]);

      const banners = (bannerRes.data || []).filter(b => b.isActive);
      const weekendSale = (weekendRes.data?.products || weekendRes.data || []);
      const regularCollections = (regularRes.data?.products || regularRes.data || []);
      
      setHome({ 
        ...data, 
        banners, 
        weekendSale, 
        regularCollections 
      });
      triggerEntrance();
    } catch (e) {
      setError(e.response?.data?.message || 'The gallery is currently being curated. Please try again soon.');
    } finally {
      if (!refresh) setLoading(false);
      setRefreshing(false);
    }
  };

  const triggerEntrance = () => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(contentFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(contentTranslateY, { toValue: 0, friction: 8, tension: 20, useNativeDriver: true })
    ]).start();
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadWrap}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <SafeAreaView edges={['top']}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
            <SkeletonBox width={150} height={30} style={{ borderRadius: 8 }} />
            <SkeletonBox width={SW - 48} height={50} style={{ marginTop: 20, borderRadius: 16 }} />
          </View>
        </SafeAreaView>
        <SkeletonBox width={SW} height={250} />
        <View style={{ padding: 24, gap: 15 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonBox width="40%" height={20} />
            <SkeletonBox width="20%" height={15} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <SkeletonBox width={140} height={180} style={{ borderRadius: 24 }} />
            <SkeletonBox width={140} height={180} style={{ borderRadius: 24 }} />
          </View>
        </View>
      </View>
    );
  }

  if (error) return <ErrorState message={error} onRetry={() => load(true)} />;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        style={styles.wrap}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 1 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111" />}
      >

        {/* Luxury Brand Header */}
        <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerEst}>SRI VINAYAKA COLLECTIONS</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Image source={logoSource} style={{ width: 44, height: 44 }} contentFit="contain" />
                  <Text style={styles.brandName}>{user?.name?.startsWith('User ') ? 'WELCOME' : user?.name || 'SRI VINAYAKA'}</Text>
                </View>
              </View>
              <View style={[styles.headerActions, { gap: 12 }]}>
                <TouchableOpacity
                  style={styles.profileCircle}
                  onPress={() => navigation.navigate('Search')}
                >
                  <Text style={{ fontSize: 18 }}>🔍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileCircle} onPress={() => navigation.navigate('ProfileTab')}>
                  {user?.profileImage ? (
                    <Image source={{ uri: getImageUrl(user.profileImage) }} style={{ width: '100%', height: '100%', borderRadius: 22 }} />
                  ) : (
                    <Text style={{ fontSize: 18 }}>👤</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Shop by Price Card Section */}
            <View style={styles.priceSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                decelerationRate="fast"
                contentContainerStyle={styles.priceCardScroll}
              >
                {[499, 799, 999, 1499, 1999, 2499, 2999, 3499, 3999, 4999, 9999].map((max, idx) => (
                  <TouchableOpacity
                    key={max}
                    onPress={() => navigation.navigate('ProductListing', {
                      maxPrice: max,
                      title: `Below ₹${max.toLocaleString()}`
                    })}
                    style={[
                      styles.priceCard,
                      { backgroundColor: idx % 2 === 0 ? '#F9F4EE' : '#F1E9E2' }
                    ]}
                  >
                    <Text style={styles.priceCardLabel}>UNDER</Text>
                    <Text style={styles.priceCardValue}>₹{max.toLocaleString()}</Text>
                    <View style={styles.priceCardCircle} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Animated.View>

        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentTranslateY }] }}>
          {/* Banner Carousel */}
          <View style={styles.bannerSection}>
            <BannerCarousel banners={home.banners || []} />
          </View>

          {/* Fabric Curation (Categories) */}
          <FadeInView delay={100}>
            <View style={styles.catSection}>
              <View style={styles.sectionHead}>
                <Text style={styles.luxeTitle}>SHOP BY CATEGORIES</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CategoryListing')}>
                  <Text style={styles.seeAll}>VIEW</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.catGrid}>
                {(home.categories || []).map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={styles.catCardGrid}
                    onPress={() => navigation.navigate('SubcategoryListing', { categoryId: cat._id, title: cat.name })}
                  >
                    <View style={styles.catImgWrap}>
                      <Image
                        source={{ uri: getImageUrl(cat.mobileBannerImage || cat.image) || 'https://via.placeholder.com/200x300' }}
                        style={styles.catImg}
                        contentFit="fill"
                      />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
                      <Text style={styles.catOverlayTextGrid}>{cat.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {/* View All Card to fill the gap */}
                <TouchableOpacity
                  style={[styles.catCardGrid, styles.viewAllCard]}
                  onPress={() => navigation.navigate('CategoryListing')}
                >
                  <LinearGradient colors={['#ffffff', '#F9F6F2']} style={styles.viewAllInner}>
                    <View style={styles.viewAllCircle}>
                       <Text style={styles.viewAllIcon}>{'>'}</Text>
                    </View>
                    <Text style={styles.viewAllTitle}>VIEW ALL</Text>
                    <Text style={styles.viewAllSub}>Collections</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </FadeInView>

          {/* Exclusive Sections */}
          {dynamicSections.map(({ key, label, route, routeParams }) => {
            const items = home[key] || [];
            if (items.length === 0) return null;

            return (
              <FadeInView key={key} delay={200}>
                <View style={styles.productSection}>
                  <View style={styles.sectionHead}>
                    <Text style={styles.luxeTitle}>{label}</Text>
                    {items.length > 4 && (
                      <TouchableOpacity onPress={() => navigation.navigate(route, routeParams)}>
                        <Text style={styles.seeAll}>DISCOVER ALL</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    removeClippedSubviews={true}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  >
                    {items.map((p) => (
                      <ProductCard
                        key={p._id}
                        product={p}
                        onPress={() => navigation.navigate('ProductDetails', { productId: p._id })}
                        style={{ width: SW * 0.41 }}
                      />
                    ))}
                  </ScrollView>
                </View>
              </FadeInView>
            );
          })}

          {/* Atelier Cycle Section - Commented out as requested
          {home.atelier && (
            <View style={styles.atelierSection}>
              <LinearGradient colors={['#2D241E', '#1a1410']} style={styles.atelierCard}>
                <Text style={styles.atelierBadge}>SRI VINAYAKA ATELIER</Text>
                <Text style={styles.atelierTitle}>{home.atelier.title}</Text>
                <Text style={styles.atelierDesc}>{home.atelier.description}</Text>

                <TouchableOpacity 
                   style={styles.atelierShopBtn}
                   onPress={() => navigation.navigate('CategoryListing')}
                >
                   <Text style={styles.atelierShopBtnText}>SHOP NOW →</Text>
                </TouchableOpacity>

                <View style={styles.stepGrid}>
                  {(home.atelier.steps || []).map((step, idx) => (
                    <View key={idx} style={styles.stepRow}>
                      <Text style={styles.stepNum}>{step.num}</Text>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepSub}>{step.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.atelierImgs}>
                  <Image source={{ uri: getImageUrl(home.atelier.image1) }} style={styles.atelierImg} />
                  <Image source={{ uri: getImageUrl(home.atelier.image2) }} style={[styles.atelierImg, { marginTop: 20 }]} />
                </View>
              </LinearGradient>
            </View>
          )}
          */}


          {/* Boutique Footer - Commented out as requested
          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Image source={logoSource} style={{ width: 40, height: 40, marginBottom: 10 }} contentFit="contain" />
            <Text style={styles.footerLogo}>SRI VINAYAKA COLLECTIONS</Text>
            <Text style={styles.footerPhilosophy}>THE ART OF TIMELESS DRAPES</Text>
            <View style={styles.socialRow}>
              <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/srivinayakacollections')}>
                <Image
                  source={{ uri: 'https://img.icons8.com/ios-filled/50/d9a441/instagram-new.png' }}
                  style={styles.socialIconImg}
                  contentFit="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://youtube.com/@srivinayakacollections')}>
                <Image
                  source={{ uri: 'https://img.icons8.com/ios-filled/50/d9a441/youtube-play--v1.png' }}
                  style={styles.socialIconImg}
                  contentFit="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://wa.me/9392239145')}>
                <Image
                  source={{ uri: 'https://img.icons8.com/ios-filled/50/d9a441/whatsapp--v1.png' }}
                  style={styles.socialIconImg}
                  contentFit="contain"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.copyright}>© 2026 SRI VINAYAKA COLLECTIONS. ALL RIGHTS RESERVED.</Text>
          </View>
          */}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  wrap: { flex: 1 },
  content: { paddingBottom: 0 },
  loadWrap: { flex: 1, backgroundColor: '#fff' },

  headerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 0,
    backgroundColor: '#fff',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 1,
  },
  headerEst: {
    fontSize: 8,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase'
  },
  brandName: { fontSize: 15, fontWeight: '800', color: '#111', letterSpacing: -0.5, marginTop: 2 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f1f1'
  },

  priceSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  bannerSection: {
    marginTop: 10,
    marginBottom: 5,
  },
  priceHeader: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  priceSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111',
    letterSpacing: -0.5,
  },
  priceSubtitle: {
    fontSize: 9,
    color: '#999',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  priceCardScroll: {
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  priceCard: {
    width: 85,
    height: 50,
    borderRadius: 12,
    marginRight: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  priceCardLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: '#8c6246',
    letterSpacing: 1,
  },
  priceCardValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2D241E',
  },
  priceCardCircle: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(140, 98, 70, 0.05)',
  },

  catSection: { marginTop: 10, marginBottom: 20 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20
  },
  luxeTitle: { fontSize: 13, fontWeight: '900', color: colors.primary, letterSpacing: 2 },
  seeAll: { fontSize: 10, fontWeight: '800', color: colors.primaryLight, letterSpacing: 1 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8 },
  catCardGrid: { width: (SW - 40 - 16) / 3, height: 130, borderRadius: 16, overflow: 'hidden', marginBottom: 8 },
  catImgWrap: { flex: 1, position: 'relative' },
  catImg: { width: '100%', height: '100%' },
  catOverlayTextGrid: {
    position: 'absolute',
    bottom: 8,
    left: 4,
    right: 4,
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  viewAllCard: {
    borderWidth: 1,
    borderColor: '#F1E9E2',
    backgroundColor: '#fff',
  },
  viewAllInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  viewAllCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#8C6246',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  viewAllIcon: { fontSize: 14, color: '#8C6246' },
  viewAllTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1a1410',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  viewAllSub: {
    fontSize: 8,
    color: '#8C6246',
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  productSection: { marginTop: 20 },

  footer: { marginTop: 80, alignItems: 'center', paddingHorizontal: 40 },
  footerLine: { width: 60, height: 1, backgroundColor: '#eee', marginBottom: 30 },
  footerLogo: { fontSize: 14, fontWeight: '900', color: colors.primary, letterSpacing: 4 },
  footerPhilosophy: { fontSize: 9, color: colors.muted, marginTop: 10, letterSpacing: 3, fontWeight: '700' },
  socialRow: { flexDirection: 'row', gap: 24, marginVertical: 32 },
  socialIcon: { fontSize: 11, fontWeight: '900', color: colors.primaryLight },
  copyright: { fontSize: 9, color: colors.muted, fontWeight: '800', letterSpacing: 1 },

  // New Premium Sections
  valueSection: {
    marginTop: 40,
    backgroundColor: '#fdfcfb',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  valueGrid: {
    paddingHorizontal: 20,
    paddingRight: 24,
    gap: 20,
  },
  valueItem: {
    alignItems: 'center',
    width: SW / 2.5,
  },
  valueIconOuter: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#d9a441',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  valueIcon: { fontSize: 24 },
  valueTitle: { fontSize: 11, fontWeight: '900', color: '#111', textTransform: 'uppercase', textAlign: 'center' },
  valueDesc: { fontSize: 9, color: '#999', marginTop: 4, textAlign: 'center', fontWeight: '600' },

  atelierSection: { marginTop: 40, paddingHorizontal: 20 },
  atelierCard: {
    borderRadius: 32,
    padding: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  atelierBadge: { color: '#d9a441', fontSize: 10, fontWeight: '800', letterSpacing: 3, marginBottom: 12 },
  atelierTitle: { fontSize: 28, fontWeight: '900', color: '#fff', fontStyle: 'italic', marginBottom: 16 },
  atelierDesc: { display: 'none' },
  atelierShopBtn: {
    backgroundColor: '#d9a441',
    alignSelf: 'flex-start',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 32,
    shadowColor: '#d9a441',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  atelierShopBtnText: {
    color: '#1a1410',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  stepGrid: { gap: 24 },
  stepRow: { flexDirection: 'row', gap: 16 },
  stepNum: { fontSize: 24, fontWeight: '900', color: '#d9a441', opacity: 0.4 },
  stepContent: { flex: 1 },
  stepTitle: { color: '#fff', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  stepSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, fontWeight: '500' },
  atelierImgs: { flexDirection: 'row', gap: 12, marginTop: 40 },
  atelierImg: { flex: 1, height: 200, borderRadius: 16, backgroundColor: '#333' },
  socialIconImg: {
    width: 24,
    height: 24,
    marginHorizontal: 12,
  },
});

export default HomeScreen;
