import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { cachedGet, getImageUrl } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import ProductCard from '../components/ProductCard';
import { SkeletonBox } from '../components/SkeletonCard';
import { ErrorState } from '../components/States';
import { inr } from '../utils/currency';
import { colors, spacing, radius, typography } from '../app/theme';

const { width: SW } = Dimensions.get('window');

const getVariantAwareImages = (product, variant) => {
  const baseImages = Array.isArray(product?.images) ? product.images.filter(Boolean) : [];
  if (!variant?.imageUrl) return baseImages;
  return [variant.imageUrl, ...baseImages.filter((img) => img !== variant.imageUrl)];
};

const getVariantSalePrice = (variant, fallbackBasePrice = 0) => {
  if (!variant) return Number(fallbackBasePrice || 0);
  const explicitBasePrice = Number(variant.basePrice ?? 0);
  if (explicitBasePrice > 0) return explicitBasePrice;
  return Math.max(Number(fallbackBasePrice || 0) + Number(variant.additionalPrice || 0), 0);
};

const getVariantMrpPrice = (variant, fallbackMrp = 0, resolvedSalePrice = 0) => {
  if (!variant) return Math.max(Number(fallbackMrp || 0), Number(resolvedSalePrice || 0));
  const explicitMrpPrice = Number(variant.mrpPrice ?? 0);
  if (explicitMrpPrice > 0) return explicitMrpPrice;
  return Math.max(Number(fallbackMrp || 0), Number(resolvedSalePrice || 0));
};

const getCheapestVariant = (variants = [], fallbackBasePrice = 0) => {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  return [...variants].sort(
    (a, b) => getVariantSalePrice(a, fallbackBasePrice) - getVariantSalePrice(b, fallbackBasePrice)
  )[0];
};

const getColorOptions = (variants = []) =>
  Array.from(
    new Map(
      variants.map((variant) => [
        variant.color,
        {
          color: variant.color,
          colorHex: variant.colorHex,
          firstVariant: variant,
          hasStock: Number(variant.countInStock || 0) > 0,
        },
      ])
    ).values()
  );

const getSizeOptions = (variants = [], color) => {
  if (!color) return [];
  return [...new Set(variants.filter((variant) => variant.color === color).map((variant) => variant.size))];
};

const ProductDetailsScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [heroIdx, setHeroIdx] = useState(0);
  const insets = useSafeAreaInsets();

  // Animation values
  const infoFade = useRef(new Animated.Value(0)).current;
  const infoSlide = useRef(new Animated.Value(30)).current;

  const addToCart = useAppStore((s) => s.addToCart);
  const cart = useAppStore((s) => s.cart);
  const addRecent = useAppStore((s) => s.addRecent);
  const showToast = useAppStore((s) => s.showToast);
  const toggleWishlist = useAppStore((s) => s.toggleWishlist);
  const wishlist = useAppStore((s) => s.wishlist);

  const isWishlisted = product ? wishlist.some((p) => p._id === product._id) : false;

  const isInCart = product ? cart.some((i) => {
    const currentId = selectedVariant
      ? `${product._id}-${selectedVariant._id || selectedVariant.sku}`
      : product._id;
    const itemId = i.selectedVariant
      ? `${i.product._id}-${i.selectedVariant._id || i.selectedVariant.sku}`
      : i.product._id;
    return currentId === itemId;
  }) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cachedGet(`/api/products/${productId}`, 5000);
      setProduct(data);
      addRecent(data);
      if (data.variants?.length) {
        const cheapestVariant = getCheapestVariant(data.variants, data.basePrice) || data.variants[0];
        setSelectedVariant(cheapestVariant);
        setSelectedColor(cheapestVariant.color || '');
        setSelectedSize(cheapestVariant.size || '');
      }
      
      // Trigger animation after slightly after image loads
      Animated.parallel([
          Animated.timing(infoFade, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(infoSlide, { toValue: 0, friction: 8, tension: 20, useNativeDriver: true })
      ]).start();

      const sim = await cachedGet('/api/products', 5000, {
        params: { category: data.category?._id, limit: 10 },
      });
      setSimilar(Array.isArray(sim) ? sim.filter((p) => p._id !== data._id) : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Product unavailable');
    } finally {
      setLoading(false);
    }
  }, [productId, addRecent]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <SkeletonBox width={SW} height={500} style={{ borderRadius: 0 }} />
        <View style={{ padding: 24, gap: 12 }}>
          <SkeletonBox width="80%" height={28} />
          <SkeletonBox width="40%" height={20} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <SkeletonBox width={100} height={40} />
            <SkeletonBox width={100} height={40} />
          </View>
        </View>
      </View>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!product) return null;

  const colorOptions = getColorOptions(product.variants || []);
  const sizeOptions = getSizeOptions(product.variants || [], selectedColor);
  const displayImages = getVariantAwareImages(product, selectedVariant);
  const heroImage = displayImages[heroIdx] || displayImages[0] || product.images?.[0];

  const salePrice = selectedVariant
    ? getVariantSalePrice(selectedVariant, product.basePrice)
    : Number(product.basePrice || 0);
  const normalizedMrpPrice = selectedVariant
    ? getVariantMrpPrice(selectedVariant, product.discountPrice, salePrice)
    : Number(product.discountPrice || 0);
  const mrpPrice = normalizedMrpPrice > salePrice ? normalizedMrpPrice : null;
  const discountPct = mrpPrice
    ? Math.round(((mrpPrice - salePrice) / mrpPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isInCart) {
        navigation.navigate('Cart');
        return;
    }

    const stock = selectedVariant ? selectedVariant.countInStock : product.countInStock;
    if (stock === 0) {
      showToast('Out of Stock: This variant is unavailable.', 'error');
      return;
    }

    addToCart(product, 1, selectedVariant);
    showToast(`${product.name} added to bag!`);
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setSelectedColor(variant?.color || '');
    setSelectedSize(variant?.size || '');
    setHeroIdx(0);
  };

  const handleColorSelect = (color) => {
    const colorVariants = (product.variants || []).filter((variant) => variant.color === color);
    const nextVariant =
      colorVariants.find((variant) => variant.size === selectedSize && Number(variant.countInStock || 0) > 0) ||
      colorVariants.find((variant) => Number(variant.countInStock || 0) > 0) ||
      colorVariants[0];

    if (!nextVariant) return;

    setSelectedColor(color);
    setSelectedSize(nextVariant.size || '');
    setSelectedVariant(nextVariant);
    setHeroIdx(0);
  };

  const handleSizeSelect = (size) => {
    const nextVariant = (product.variants || []).find(
      (variant) => variant.color === selectedColor && variant.size === size
    );
    if (!nextVariant) return;
    setSelectedSize(size);
    setSelectedVariant(nextVariant);
    setHeroIdx(0);
  };

  const shareProduct = () => {
    showToast('Product link copied to clipboard!');
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    showToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', isWishlisted ? 'info' : 'success');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Gallery Header */}
        <View style={styles.galleryContainer}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() =>
              navigation.navigate('ProductImageGallery', {
                images: displayImages,
                startIndex: heroIdx,
              })
            }
          >
            <Image
              source={{ uri: getImageUrl(heroImage) || 'https://via.placeholder.com/400x600?text=Saree' }}
              style={styles.hero}
              contentFit="fill"
              contentPosition="top center"
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>

          {/* Floating Actions */}
          <View style={styles.floatingHeader}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.btnIcon}>←</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.circleBtn} onPress={shareProduct}>
                <Text style={styles.btnIcon}>↗️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleBtn} onPress={handleToggleWishlist}>
                <Text style={styles.btnIcon}>{isWishlisted ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        <Animated.View style={[styles.detailsCard, { opacity: infoFade, transform: [{ translateY: infoSlide }] }]}>
          <View style={styles.luxuryIndicator} />

          <View style={styles.mainInfo}>
            <Text style={styles.categoryName}>{product.category?.name || 'Handcrafted Collection'}</Text>
            <Text style={styles.productName}>{product.name}</Text>

            <View style={styles.priceContainer}>
              <View style={styles.priceColumn}>
                <Text style={styles.priceLabel}>Price</Text>
                <View style={styles.salePriceRow}>
                  <Text style={styles.saleText}>SALE</Text>
                  <Text style={styles.mainPrice}>{inr(salePrice)}</Text>
                </View>
              </View>
              <View style={styles.rightPriceMeta}>
                {mrpPrice ? (
                  <View style={styles.mrpWrap}>
                    <Text style={styles.mrpLabel}>MRP</Text>
                    <Text style={styles.mrpPrice}>{inr(mrpPrice)}</Text>
                  </View>
                ) : null}
                {discountPct > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>SAVE {discountPct}%</Text>
                  </View>
                )}
              </View>
            </View>

            {product.countInStock < 5 && product.countInStock > 0 && (
              <Text style={styles.stockAlert}>🔥 Only {product.countInStock} limited pieces left!</Text>
            )}
          </View>

          {/* Variants */}
          {colorOptions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Hue</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {colorOptions.map((option, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.variantCard,
                      selectedColor === option.color && styles.variantCardActive,
                      !option.hasStock && styles.variantCardOos,
                    ]}
                    onPress={() => handleColorSelect(option.color)}
                    disabled={!option.hasStock}
                  >
                    <View style={[styles.colorIndicator, { backgroundColor: option.colorHex || '#ccc' }]} />
                    <Text style={[styles.variantName, selectedColor === option.color && { color: '#fff' }]}>{option.color}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {sizeOptions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Size Selection</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {sizeOptions.map((size) => {
                  const sizeVariant = (product.variants || []).find(
                    (variant) => variant.color === selectedColor && variant.size === size
                  );
                  const outOfStock = Number(sizeVariant?.countInStock || 0) <= 0;

                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeChip,
                        selectedSize === size && styles.sizeChipActive,
                        outOfStock && styles.sizeChipOos,
                      ]}
                      onPress={() => handleSizeSelect(size)}
                      disabled={outOfStock}
                    >
                      <Text style={[
                        styles.sizeChipText,
                        selectedSize === size && styles.sizeChipTextActive,
                        outOfStock && styles.sizeChipTextOos,
                      ]}>
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}



          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Craftsmanship Narrative</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Benefits Strip */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✨</Text>
              <Text style={styles.benefitText}>MASTER CRAFTED</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🚚</Text>
              <Text style={styles.benefitText}>PRIORITY TRANSIT</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🏷️</Text>
              <Text style={styles.benefitText}>BOUTIQUE RETURN</Text>
            </View>
          </View>
        </Animated.View>

        {/* Similar Products */}
        {similar.length > 0 && (
          <View style={styles.similarWrapper}>
             <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
                 <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, color: '#111' }}>COMPLIMENTARY PIECES</Text>
             </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {similar.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  style={{ width: 150 }}
                  onPress={() => navigation.push('ProductDetails', { productId: p._id })}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Floating Buy Bar */}
      <View style={[styles.buyBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.buyPriceArea}>
          <Text style={styles.finalPrice}>{inr(salePrice)}</Text>
          <Text style={styles.taxText}>Exclusive of Taxes</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.wishlistBarBtn, isWishlisted && styles.wishlistBarBtnActive]} 
          onPress={handleToggleWishlist}
        >
          <Text style={styles.wishlistBarIcon}>{isWishlisted ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainCta, product.countInStock === 0 && styles.ctaDisabled]}
          onPress={handleAddToCart}
          disabled={product.countInStock === 0}
        >
          <Text style={styles.mainCtaText}>
            {product.countInStock === 0 ? 'NOTIFY ME' : isInCart ? 'VIEW BAG' : 'ADD TO BAG'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadWrap: { flex: 1, backgroundColor: '#fff' },

  galleryContainer: { position: 'relative', width: SW, height: SW * 1.35 },
  hero: { width: '100%', height: '100%' },

  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  btnIcon: { fontSize: 18, fontWeight: '700', color: '#111' },

  detailsCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  luxuryIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  categoryName: { fontSize: 11, fontWeight: '900', color: colors.primaryLight, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  productName: { fontSize: 26, fontWeight: '900', color: '#111', lineHeight: 32, marginBottom: 16 },

  priceContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  priceLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  salePriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  saleText: { fontSize: 11, color: colors.primaryLight, textTransform: 'uppercase', letterSpacing: 2, fontWeight: '800' },
  mainPrice: { fontSize: 28, fontWeight: '900', color: '#111' },
  rightPriceMeta: { alignItems: 'flex-end', gap: 10 },
  mrpWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  mrpLabel: { fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700' },
  mrpPrice: { fontSize: 18, color: '#9ca3af', textDecorationLine: 'line-through', fontWeight: '500' },
  discountBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  discountText: { color: '#047857', fontWeight: '800', fontSize: 12 },

  stockAlert: { color: '#b91c1c', fontWeight: '800', fontSize: 11, letterSpacing: 0.5, marginBottom: 16 },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#111', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },

  variantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#eee',
  },
  variantCardActive: { backgroundColor: '#111', borderColor: '#111' },
  variantCardOos: { opacity: 0.4 },
  colorIndicator: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  variantName: { fontSize: 14, fontWeight: '700', color: '#444' },
  sizeChip: {
    minWidth: 76,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e7d8c7',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeChipActive: {
    backgroundColor: '#f8efe5',
    borderColor: colors.primary,
  },
  sizeChipOos: {
    opacity: 0.45,
    borderStyle: 'dashed',
  },
  sizeChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5b4631',
  },
  sizeChipTextActive: {
    color: colors.primary,
  },
  sizeChipTextOos: {
    color: '#999',
  },



  descriptionText: { fontSize: 14, color: '#666', lineHeight: 22, fontWeight: '500', marginBottom: 12 },

  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  benefitItem: { alignItems: 'center', flex: 1 },
  benefitIcon: { fontSize: 18, marginBottom: 6 },
  benefitText: { fontSize: 9, color: '#999', fontWeight: '800', letterSpacing: 1 },

  similarWrapper: { marginTop: 40, paddingBottom: 40 },

  buyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  buyPriceArea: { flex: 0.35 },
  finalPrice: { fontSize: 20, fontWeight: '900', color: '#111' },
  taxText: { fontSize: 9, color: '#999', marginTop: 2, fontWeight: '600' },
  wishlistBarBtn: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  wishlistBarBtnActive: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFE0E0',
  },
  wishlistBarIcon: { fontSize: 22 },
  mainCta: {
    flex: 0.65,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  ctaDisabled: { backgroundColor: '#ccc' },
  mainCtaText: { color: colors.accent, fontWeight: '900', fontSize: 14, letterSpacing: 2 },
});

export default ProductDetailsScreen;
