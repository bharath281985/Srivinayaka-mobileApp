import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { getImageUrl } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { inr } from '../utils/currency';
import { EmptyState } from '../components/States';
import { colors } from '../app/theme';

const { width: SW } = Dimensions.get('window');

const CartItem = ({ item, index, updateQty, removeFromCart, navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const unitPrice = Number(item.selectedVariant?.basePrice || 0) || ((item.product.basePrice || 0) + (item.selectedVariant?.additionalPrice || 0));

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX }] }}>
      <View style={styles.cartItem}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ProductDetails', { productId: item.product._id })}
        >
          <Image
            source={{ uri: getImageUrl(item.selectedVariant?.imageUrl || item.product.images?.[0]) || 'https://via.placeholder.com/100' }}
            style={styles.img}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </TouchableOpacity>

        <View style={styles.itemMeta}>
          <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
          <Text style={styles.itemFabric}>{item.product.fabric || 'Product'}</Text>

          {item.selectedVariant && (
            <View style={styles.variantChip}>
              <View style={[styles.dot, { backgroundColor: item.selectedVariant.colorHex || '#333' }]} />
              <Text style={styles.variantText}>{item.selectedVariant.color}</Text>
            </View>
          )}

          <View style={styles.bottomRow}>
            <Text style={styles.priceText}>{inr(unitPrice * item.qty)}</Text>
            <View style={styles.qtyBox}>
              <TouchableOpacity style={styles.qBtn} onPress={() => updateQty(item, -1)}>
                <Text style={styles.qBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qVal}>{item.qty}</Text>
              <TouchableOpacity style={styles.qBtn} onPress={() => updateQty(item, 1)}>
                <Text style={styles.qBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.trash}
          onPress={() => removeFromCart(item.product._id, item.selectedVariant?._id || item.selectedVariant?.sku)}
        >
          <Text style={styles.trashText}>x</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const CartScreen = ({ navigation }) => {
  const cart = useAppStore((s) => s.cart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const addToCart = useAppStore((s) => s.addToCart);
  const cartTotals = useAppStore((s) => s.cartTotals);
  const setPostLoginRedirect = useAuthStore((s) => s.setPostLoginRedirect);
  const token = useAuthStore((s) => s.token);
  const { itemsPrice, count } = cartTotals();
  const insets = useSafeAreaInsets();

  const handleCheckout = () => {
    if (!token) {
      setPostLoginRedirect('Checkout');
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }
    navigation.navigate('Checkout');
  };

  const updateQty = (item, delta) => {
    const { product, selectedVariant, qty } = item;
    const newQty = qty + delta;

    if (newQty <= 0) {
      Alert.alert('Remove Item', 'Remove this product from your cart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(product._id, selectedVariant?._id || selectedVariant?.sku) },
      ]);
      return;
    }

    const stock = selectedVariant ? selectedVariant.countInStock : product.countInStock;
    if (newQty > (stock || 99)) {
      Alert.alert('Stock Limit', 'Maximum available stock reached.');
      return;
    }

    addToCart(product, delta, selectedVariant);
  };

  if (!cart.length) {
    return (
      <EmptyState
        icon="Cart"
        title="Your cart is empty"
        subtitle="Add products to your cart to continue."
        actionText="Go to Home"
        onAction={() => navigation.navigate('Home')}
      />
    );
  }

  return (
    <View style={styles.full}>
      <SafeAreaView style={styles.wrap} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CART</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{count} ITEMS</Text>
          </View>
        </View>

        <FlatList
          data={cart}
          keyExtractor={(item) => (item.selectedVariant ? `${item.product._id}-${item.selectedVariant._id || item.selectedVariant.sku}` : item.product._id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <CartItem
              item={item}
              index={index}
              updateQty={updateQty}
              removeFromCart={removeFromCart}
              navigation={navigation}
            />
          )}
        />
      </SafeAreaView>

      <View style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <LinearGradient colors={['#fff', '#fdfcfb']} style={styles.checkoutWrap}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>{inr(itemsPrice)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: '#fff' },
  wrap: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  headerBadge: { backgroundColor: '#fdf8f1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primaryLight },
  list: { padding: 24, paddingBottom: 150 },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#fff',
    gap: 16,
    position: 'relative',
  },
  img: { width: 100, height: 135, borderRadius: 16, backgroundColor: '#f8f9fa' },
  itemMeta: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  itemFabric: { fontSize: 12, color: '#777', marginBottom: 8 },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    gap: 6,
    marginBottom: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  variantText: { fontSize: 11, fontWeight: '600', color: '#666' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  priceText: { fontSize: 18, fontWeight: '800', color: colors.primary },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    gap: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  qBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  qBtnText: { fontSize: 18, fontWeight: '600' },
  qVal: { fontSize: 14, fontWeight: '800' },
  trash: { position: 'absolute', top: 0, right: 0, padding: 4 },
  trashText: { fontSize: 16, opacity: 0.4 },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    width: SW,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#f1f1f1',
  },
  checkoutWrap: { padding: 24, paddingBottom: 0 },
  totalBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 12, fontWeight: '700', color: '#777' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#111' },
  checkoutBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: { color: colors.accent, fontWeight: '800', fontSize: 15 },
});

export default CartScreen;
