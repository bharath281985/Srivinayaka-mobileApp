import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { inr } from '../utils/currency';
import { colors, radius, typography } from '../app/theme';
import { useAppStore } from '../store/useAppStore';
import { getImageUrl } from '../services/api';

const FALLBACK_URI = 'https://via.placeholder.com/300x420?text=Saree';

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

const ProductCard = memo(({ product, onPress, style }) => {
  const toggleWishlist = useAppStore((s) => s.toggleWishlist);
  const wishlist = useAppStore((s) => s.wishlist);
  const isWishlisted = wishlist.some((p) => p._id === product._id);

  const cheapestVariant = getCheapestVariant(product.variants, product.basePrice);
  const salePrice = cheapestVariant
    ? getVariantSalePrice(cheapestVariant, product.basePrice)
    : Number(product.basePrice || 0);
  const normalizedMrpPrice = cheapestVariant
    ? getVariantMrpPrice(cheapestVariant, product.discountPrice, salePrice)
    : Number(product.discountPrice || 0);
  const mrpPrice = normalizedMrpPrice > salePrice ? normalizedMrpPrice : null;
  const discountPct = mrpPrice
    ? Math.round(((mrpPrice - salePrice) / mrpPrice) * 100)
    : 0;

  return (
    <View style={style}>
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.92}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getImageUrl(product.images?.[0]) || FALLBACK_URI }}
            style={styles.image}
            contentFit="fill"
            cachePolicy="memory-disk"
          />
          {discountPct > 0 && (
            <View style={styles.promoBadge}>
              <Text style={styles.promoText}>SAVE {discountPct}%</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.wishlistCircle}
            onPress={(e) => { e.stopPropagation?.(); toggleWishlist(product); }}
            hitSlop={8}
          >
            <Text style={{ fontSize: 14 }}>{isWishlisted ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoArea}>
          <Text style={styles.fabricType}>{product.fabric || 'Pure Collection'}</Text>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <View style={styles.priceWrap}>
            <View style={styles.saleRow}>
              <Text style={styles.saleLabel}>Sale</Text>
              <Text style={styles.currentPrice}>{inr(salePrice)}</Text>
            </View>
            {mrpPrice && (
              <View style={styles.mrpRow}>
                <Text style={styles.mrpLabel}>MRP</Text>
                <Text style={styles.oldPrice}>{inr(mrpPrice)}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 165,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  imageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#f8f8f8',
  },
  image: { width: '100%', height: '100%' },
  promoBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  promoText: { color: '#047857', fontSize: 9, fontWeight: '900' },
  wishlistCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoArea: { padding: 12 },
  fabricType: { fontSize: 10, color: colors.primaryLight, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  name: { fontSize: 13, color: '#1a1a1a', fontWeight: '600', marginBottom: 6 },
  priceWrap: { gap: 4 },
  saleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  saleLabel: { fontSize: 9, color: colors.primaryLight, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  currentPrice: { fontSize: 15, fontWeight: '900', color: '#111' },
  mrpRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  mrpLabel: { fontSize: 9, color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' },
  oldPrice: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through', fontWeight: '500' },
});

export default ProductCard;
