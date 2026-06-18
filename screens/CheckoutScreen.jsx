import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { cachedGet } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { inr } from '../utils/currency';
import { colors, spacing, radius, typography } from '../app/theme';

const STORE_PICKUP_DETAILS = {
  name: 'Sri Vinayaka Collections',
  address: '#5-4-161, M.G. Road, Near T19 Towers',
  city: 'Ranigunj, Secunderabad',
  state: 'Telangana',
  postalCode: '500003',
  country: 'India',
  phone: '9392239145',
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COLORS = ['#16a34a', '#f59e0b', '#ef4444', '#2563eb', '#db2777', '#7c3aed'];
const CONFETTI_PIECES = Array.from({ length: 28 }, (_, index) => ({
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  delay: (index % 7) * 90,
  duration: 1200 + (index % 5) * 130,
  left: 14 + ((index * 37) % Math.max(80, SCREEN_WIDTH - 40)),
  rotation: index % 2 === 0 ? '180deg' : '-180deg',
  size: 7 + (index % 4),
}));

const CheckoutScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const cart = useAppStore((s) => s.cart);
  const cartTotals = useAppStore((s) => s.cartTotals);
  const addresses = useAppStore((s) => s.addresses);
  const setAddresses = useAppStore((s) => s.setAddresses);
  const showToast = useAppStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const setPostLoginRedirect = useAuthStore((s) => s.setPostLoginRedirect);
  const { itemsPrice } = cartTotals();

  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOptions, setCouponOptions] = useState([]);
  const [couponOptionsOpen, setCouponOptionsOpen] = useState(false);
  const [couponOptionsLoading, setCouponOptionsLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [taxConfig, setTaxConfig] = useState({ enabled: false, rate: 0, label: 'GST' });
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null);
  const [fulfillmentMethod, setFulfillmentMethod] = useState('delivery');
  const [showPickupCelebration, setShowPickupCelebration] = useState(false);
  const confettiAnimations = useRef(CONFETTI_PIECES.map(() => new Animated.Value(0))).current;
  const celebrationScale = useRef(new Animated.Value(0.9)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationTimerRef = useRef(null);
  const paymentMethod = 'Online';
  const isHomeDelivery = fulfillmentMethod === 'delivery';

  const [shippingAddress, setShippingAddress] = useState({
    address: addresses.find((a) => a.isDefault)?.address || addresses[0]?.address || '',
    city: addresses.find((a) => a.isDefault)?.city || addresses[0]?.city || '',
    state: addresses.find((a) => a.isDefault)?.state || addresses[0]?.state || '',
    postalCode: addresses.find((a) => a.isDefault)?.postalCode || addresses[0]?.postalCode || '',
    country: 'India',
    phone: addresses.find((a) => a.isDefault)?.phone || addresses[0]?.phone || '',
    addressType: 'Home',
  });

  useEffect(() => {
    if (!token) {
      setPostLoginRedirect('Checkout');
      navigation.replace('Auth', { screen: 'Login' });
    }
  }, [navigation, setPostLoginRedirect, token]);

  useEffect(() => {
    if (addresses.length > 0 && !shippingAddress.address) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setShippingAddress({
        address: def.address,
        city: def.city,
        state: def.state || '',
        postalCode: def.postalCode,
        country: def.country || 'India',
        phone: def.phone || '',
        addressType: 'Home',
      });
    }
  }, [addresses]);

  useEffect(() => {
    cachedGet('/api/settings/tax_config', 60000)
      .then((res) => {
        const v = res?.value || res;
        if (v && (v.enabled || v.rate != null)) {
          setTaxConfig({ enabled: !!v.enabled, rate: Number(v.rate) || 0, label: v.label || 'GST' });
        }
      })
      .catch(() => {});

    cachedGet('/api/shipping', 30000)
      .then((res) => {
        const active = (res || []).filter((m) => m.isActive);
        setShippingMethods(active);
        if (active.length > 0) setSelectedShippingMethod(active[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCouponOptionsLoading(true);
    api.get('/api/coupons/public')
      .then((res) => {
        setCouponOptions(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error('Error fetching coupons', err);
      })
      .finally(() => {
        setCouponOptionsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    cachedGet('/api/users/addresses', 30000)
      .then((res) => {
        const list = Array.isArray(res) ? res : [];
        if (!list.length) return;
        const mapped = list.map((a) => ({
          id: a._id,
          address: a.addressLine,
          city: a.city,
          state: a.state || '',
          postalCode: a.zipCode,
          country: a.country || 'India',
          phone: a.phone || '',
          addressType: a.label || 'Home',
          isDefault: !!a.isDefault,
        }));
        setAddresses(mapped);
      })
      .catch(() => {});
  }, [user?._id, setAddresses]);

  useEffect(() => () => {
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
  }, []);

  const closePickupCelebration = () => {
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    setShowPickupCelebration(false);
  };

  const runPickupCelebration = () => {
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    confettiAnimations.forEach((anim) => anim.setValue(0));
    celebrationScale.setValue(0.9);
    celebrationOpacity.setValue(0);
    setShowPickupCelebration(true);

    Animated.parallel([
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      ...confettiAnimations.map((anim, index) => (
        Animated.timing(anim, {
          toValue: 1,
          duration: CONFETTI_PIECES[index].duration,
          delay: CONFETTI_PIECES[index].delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      )),
    ]).start();

    celebrationTimerRef.current = setTimeout(() => {
      setShowPickupCelebration(false);
    }, 2600);
  };

  const selectStorePickup = () => {
    setFulfillmentMethod('pickup');
    runPickupCelebration();
  };

  const getDiscount = () => {
    if (!couponData) return 0;
    if (couponData.discountType === 'percent') {
      return Math.min((itemsPrice * couponData.discountValue) / 100, couponData.maxDiscount || Infinity);
    }
    return Math.min(couponData.discountValue, itemsPrice);
  };

  const discount = getDiscount();
  const mrpTotal = cart.reduce((sum, item) => {
    const variantSalePrice = Number(item.selectedVariant?.basePrice || 0) || (Number(item.product.basePrice || 0) + Number(item.selectedVariant?.additionalPrice || 0));
    const variantMrpPrice = Number(item.selectedVariant?.mrpPrice || 0);
    const resolvedMrp = variantMrpPrice > variantSalePrice
      ? variantMrpPrice
      : Number(item.originalMrp || item.product.discountPrice || variantSalePrice || 0);
    return sum + (resolvedMrp * item.qty);
  }, 0);
  const salePriceTotal = itemsPrice;
  const youSavedAmount = Math.max(0, mrpTotal - salePriceTotal);
  const taxAmount = taxConfig.enabled && taxConfig.rate > 0 ? Math.round(itemsPrice * taxConfig.rate / 100) : 0;
  const totalQuantity = cart.reduce((sum, item) => sum + item.qty, 0);
  const deliveryCharge = isHomeDelivery && selectedShippingMethod ? (selectedShippingMethod.price * totalQuantity) : 0;
  const totalPrice = Math.max(itemsPrice + taxAmount + deliveryCharge - discount, 0);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/api/coupons/validate', {
        code: couponCode.trim().toUpperCase(),
        orderAmount: itemsPrice,
        userId: user?._id,
      });
      setCouponData(data);
    } catch (e) {
      setCouponData(null);
      showToast(e.response?.data?.message || 'This coupon could not be applied.', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSelectCoupon = async (code) => {
    setCouponCode(code);
    setCouponLoading(true);
    setCouponOptionsOpen(false);
    try {
      const { data } = await api.post('/api/coupons/validate', {
        code: code.trim().toUpperCase(),
        orderAmount: itemsPrice,
        userId: user?._id,
      });
      setCouponData(data);
    } catch (e) {
      setCouponData(null);
      showToast(e.response?.data?.message || 'This coupon could not be applied.', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  const formatCouponLabel = (coupon) => {
    const value = Number(coupon?.discountValue || 0);
    return coupon?.discountType === 'percent' ? `${value}% OFF` : inr(value);
  };

  const validate = () => {
    if (!isHomeDelivery) return true;
    if (!shippingAddress.address.trim()) { showToast('Please enter your address.', 'error'); return false; }
    if (!shippingAddress.city.trim()) { showToast('Please enter your city.', 'error'); return false; }
    if (!shippingAddress.postalCode.trim()) { showToast('Please enter your postal code.', 'error'); return false; }
    if (!shippingAddress.phone.trim()) { showToast('Please enter your phone number.', 'error'); return false; }
    return true;
  };

  const placeOrder = async () => {
    if (!token) {
      setPostLoginRedirect('Checkout');
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }
    if (!validate()) return;

    setPlacing(true);
    try {
      const orderShippingAddress = isHomeDelivery ? { ...shippingAddress } : {
        name: user?.name || 'Store Pickup Customer',
        address: STORE_PICKUP_DETAILS.address,
        city: STORE_PICKUP_DETAILS.city,
        state: STORE_PICKUP_DETAILS.state,
        postalCode: STORE_PICKUP_DETAILS.postalCode,
        country: STORE_PICKUP_DETAILS.country,
        phone: user?.phone || shippingAddress.phone || '',
        addressType: 'Store Pickup',
      };

      const payload = {
        orderItems: cart.map((c) => ({
          name: c.product.name,
          qty: c.qty,
          image: c.product.images?.[0] || '',
          price: Number(c.selectedVariant?.basePrice || 0) || ((c.product.basePrice || 0) + (c.selectedVariant?.additionalPrice || 0)),
          product: c.product._id,
          variant: c.selectedVariant || null,
        })),
        shippingAddress: orderShippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice: taxAmount,
        shippingPrice: deliveryCharge,
        shippingMethod: isHomeDelivery ? selectedShippingMethod?.name : 'Store Pickup',
        totalPrice,
        ...(couponData && { couponCode: couponData.code, discountAmount: discount }),
      };

      const { data } = await api.post('/api/orders', payload);
      const payment = await api.post('/api/orders/easebuzz/initiate', { orderId: data._id });
      if (!payment.data?.success || !payment.data?.url) {
        throw new Error('Payment initiation failed');
      }

      navigation.navigate('PaymentWebView', {
        paymentUrl: payment.data.url,
        orderId: data._id,
      });
    } catch (e) {
      showToast(e.response?.data?.message || e.message || 'Order failed. Please retry.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const updateAddr = (field, value) => {
    if (field === 'phone') {
      const v = value.replace(/\D/g, '');
      if (v.length <= 10) setShippingAddress((p) => ({ ...p, [field]: v }));
      return;
    }
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  if (!token) return null;

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[typography.h2, { marginBottom: spacing.md }]}>Checkout</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Option</Text>
          <View style={styles.fulfillmentGrid}>
            <TouchableOpacity
              style={[styles.fulfillmentCard, isHomeDelivery && styles.fulfillmentCardActive]}
              onPress={() => setFulfillmentMethod('delivery')}
            >
              <Text style={[styles.fulfillmentTitle, isHomeDelivery && styles.fulfillmentTitleActive]}>Home Delivery</Text>
              <Text style={styles.fulfillmentText}>Ship this order to your selected address.</Text>
              {isHomeDelivery && <Text style={styles.fulfillmentSelected}>Selected</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fulfillmentCard, !isHomeDelivery && styles.fulfillmentCardActive]}
              onPress={selectStorePickup}
            >
              <Text style={[styles.fulfillmentTitle, !isHomeDelivery && styles.fulfillmentTitleActive]}>Store Pickup</Text>
              <Text style={styles.fulfillmentText}>Collect from the store after confirmation.</Text>
              {!isHomeDelivery && <Text style={styles.fulfillmentSelected}>Selected</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {isHomeDelivery ? (
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            {addresses.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('AddressBook')}>
                <Text style={styles.link}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {addresses.length === 0 ? (
            <TouchableOpacity style={styles.addAddrPlaceHolder} onPress={() => navigation.navigate('AddressBook')}>
              <Text style={styles.addAddrTitle}>Add shipping address</Text>
              <Text style={styles.addAddrSub}>Required to place your order</Text>
            </TouchableOpacity>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 10 }}>
                {addresses.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.savedAddr, shippingAddress.address === a.address && styles.savedAddrActive]}
                    onPress={() => setShippingAddress({
                      address: a.address,
                      city: a.city,
                      state: a.state || '',
                      postalCode: a.postalCode,
                      country: a.country || 'India',
                      phone: a.phone || '',
                      addressType: 'Home',
                    })}
                  >
                    <Text style={styles.savedAddrText} numberOfLines={2}>{a.address}, {a.city}</Text>
                    {a.isDefault && <Text style={styles.defaultLabel}>Default</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* 
              <TextInput style={styles.input} placeholder="Full Address *" value={shippingAddress.address} onChangeText={(v) => updateAddr('address', v)} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="City *" value={shippingAddress.city} onChangeText={(v) => updateAddr('city', v)} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Postal Code *" keyboardType="number-pad" value={shippingAddress.postalCode} onChangeText={(v) => updateAddr('postalCode', v)} />
              </View>
              <TextInput style={styles.input} placeholder="Phone Number *" keyboardType="phone-pad" maxLength={10} value={shippingAddress.phone} onChangeText={(v) => updateAddr('phone', v)} />
              */}
            </>
          )}
        </View>
        ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Pickup Details</Text>
          <View style={styles.pickupBox}>
            <Text style={styles.pickupTitle}>No shipping address is required.</Text>
            <Text style={styles.pickupText}>
              Your order will be kept ready at Sri Vinayaka Collections. Please wait for the order confirmation before visiting the store, and carry your order ID when you come for pickup.
            </Text>
            <View style={styles.pickupHighlightBox}>
              <Text style={styles.pickupHighlightText}>You save delivery charges</Text>
            </View>
            <View style={styles.whatsappNoticeBox}>
              <Text style={styles.whatsappNoticeText}>
                Please Contact Through WhatsApp Before Visiting the Store: {STORE_PICKUP_DETAILS.phone}
              </Text>
            </View>
            <View style={styles.storeCard}>
              <Text style={styles.storeLabel}>Pickup Store</Text>
              <Text style={styles.storeName}>{STORE_PICKUP_DETAILS.name}</Text>
              <Text style={styles.storeText}>
                {STORE_PICKUP_DETAILS.address}, {STORE_PICKUP_DETAILS.city}, {STORE_PICKUP_DETAILS.state} - {STORE_PICKUP_DETAILS.postalCode}
              </Text>
              <Text style={styles.storePhone}>Phone: {STORE_PICKUP_DETAILS.phone}</Text>
            </View>
            <Text style={styles.pickupFreeText}>Delivery fee will not be charged for store pickup.</Text>
          </View>
        </View>
        )}

        {isHomeDelivery && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginVertical: 10 }}>
            {shippingMethods.map((m) => (
              <TouchableOpacity
                key={m._id}
                style={[styles.shippingCard, selectedShippingMethod?._id === m._id && styles.shippingCardActive]}
                onPress={() => setSelectedShippingMethod(m)}
              >
                <View style={styles.row}>
                  <Text style={[styles.shippingName, selectedShippingMethod?._id === m._id && styles.shippingNameActive]}>{m.name}</Text>
                </View>
                <Text style={styles.shippingPrice}>{m.price === 0 ? 'FREE' : inr(m.price)}</Text>
                <Text style={styles.shippingDays}>{m.estimatedDays}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
          <View style={styles.couponHeaderRow}>
            <Text style={styles.couponHint}>Select from available offers or enter a code manually</Text>
            <TouchableOpacity style={styles.viewCouponsBtn} onPress={() => setCouponOptionsOpen((v) => !v)}>
              <Text style={styles.viewCouponsBtnText}>{couponOptionsOpen ? 'Hide Coupons' : 'View Coupons'}</Text>
            </TouchableOpacity>
          </View>
          {couponOptionsOpen && (
            <View style={styles.couponListBox}>
              <View style={styles.couponListHeader}>
                <Text style={styles.couponListTitle}>Available Coupons</Text>
                <Text style={styles.couponCount}>{couponOptions.length} offers</Text>
              </View>
              {couponOptionsLoading ? (
                <Text style={styles.couponEmpty}>Loading coupons...</Text>
              ) : couponOptions.length === 0 ? (
                <Text style={styles.couponEmpty}>No active coupons available right now.</Text>
              ) : (
                couponOptions.map((coupon) => (
                  <View key={coupon._id || coupon.code} style={styles.couponCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.couponCode}>{coupon.code}</Text>
                      <Text style={styles.couponMeta}>{formatCouponLabel(coupon)}</Text>
                      <Text style={styles.couponMeta2}>
                        {coupon.minOrderAmount > 0 ? `Min order ${inr(coupon.minOrderAmount)}` : 'No minimum order'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.selectCouponBtn} onPress={() => handleSelectCoupon(coupon.code)}>
                      <Text style={styles.selectCouponBtnText}>Select</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Enter code"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.couponBtn} onPress={applyCoupon} disabled={couponLoading}>
              <Text style={styles.couponBtnText}>{couponLoading ? '...' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
          {couponData && (
            <View style={styles.couponSuccess}>
              <Text style={styles.couponSuccessText}>{couponData.code} applied</Text>
              <TouchableOpacity onPress={() => setCouponData(null)}><Text style={{ color: colors.danger, fontWeight: '700' }}>Remove</Text></TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Review</Text>
          {cart.map((item) => {
            const linePrice = (Number(item.selectedVariant?.basePrice || 0) || (Number(item.product.basePrice || 0) + Number(item.selectedVariant?.additionalPrice || 0))) * item.qty;
            return (
              <View key={`${item.product._id}-${item.selectedVariant?.sku || 'default'}`} style={styles.summaryRow}>
                <Text style={[styles.val, { flex: 1, paddingRight: 12 }]} numberOfLines={1}>{item.product.name} x {item.qty}</Text>
                <Text style={styles.val}>{inr(linePrice)}</Text>
              </View>
            );
          })}
          <View style={[styles.summaryDivider, { marginTop: 8, marginBottom: 8 }]} />
          <View style={styles.summaryRow}><Text style={styles.muted}>Product Total (MRP)</Text><Text style={styles.val}>Rs.{mrpTotal.toLocaleString('en-IN')}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.muted}>Subtotal</Text><Text style={styles.val}>Rs.{salePriceTotal.toLocaleString('en-IN')}</Text></View>
          {youSavedAmount > 0 && <View style={styles.summaryRow}><Text style={styles.successText}>Sri Vinayaka Discount</Text><Text style={styles.successText}>Rs.{youSavedAmount.toLocaleString('en-IN')}</Text></View>}
          <View style={styles.summaryRow}><Text style={styles.muted}>Subtotal</Text><Text style={styles.val}>Rs.{itemsPrice.toLocaleString('en-IN')}</Text></View>
          {taxAmount > 0 && <View style={styles.summaryRow}><Text style={styles.muted}>{taxConfig.label} ({taxConfig.rate}%)</Text><Text style={styles.val}>Rs.{taxAmount.toLocaleString('en-IN')}</Text></View>}
          <View style={styles.summaryRow}>
            <Text style={styles.successText}>
              {isHomeDelivery ? `Delivery Fee ${selectedShippingMethod && totalQuantity > 1 ? `(${totalQuantity} x Rs.${selectedShippingMethod.price})` : ''}` : 'Store Pickup'}
            </Text>
            <Text style={styles.successText}>{isHomeDelivery ? (deliveryCharge === 0 ? 'Free' : `Rs.${deliveryCharge.toLocaleString('en-IN')}`) : 'No delivery fee'}</Text>
          </View>
          {!isHomeDelivery && (
            <View style={styles.shippingDetailCard}>
              <View style={styles.detailCardHeader}>
                <View style={styles.detailIconWrap}><Text style={styles.detailIcon}>S</Text></View>
                <Text style={styles.detailLabel}>PICKUP SELECTED</Text>
              </View>
              <Text style={styles.pickupSummaryText}>
                No shipping address or delivery method is needed. We will confirm when the order is ready for collection.
              </Text>
            </View>
          )}
          {isHomeDelivery && selectedShippingMethod && (
            <View style={styles.shippingDetailCard}>
              <View style={styles.detailCardHeader}>
                <View style={styles.detailIconWrap}><Text style={styles.detailIcon}>🚚</Text></View>
                <Text style={styles.detailLabel}>SHIPPING DETAILS</Text>
              </View>
              <View style={styles.detailGrid}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailSubLabel}>QUANTITY</Text>
                  <Text style={styles.detailVal}>{totalQuantity} Items</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailSubLabel}>STATE</Text>
                  <Text style={styles.detailVal}>{shippingAddress.state || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.detailFooter}>
                <Text style={styles.detailRateText}>Rate: <Text style={styles.detailRateVal}>₹{selectedShippingMethod.price}</Text>/KG</Text>
                <Text style={styles.detailEst}>{selectedShippingMethod.estimatedDays} Delivery</Text>
              </View>
            </View>
          )}
          {discount > 0 && <View style={styles.summaryRow}><Text style={styles.successText}>Discount</Text><Text style={styles.successText}>-Rs.{discount.toLocaleString('en-IN')}</Text></View>}
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderColor: colors.border, marginTop: 8, paddingTop: 8 }]}>
            <Text style={styles.bold}>Total</Text>
            <Text style={styles.primaryBold}>Rs.{totalPrice.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={[styles.payMethod, styles.payMethodActive]}>
            <Text style={[styles.bold, { color: colors.primary }]}>Online Payment</Text>
            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Secure Online Payment (UPI, Cards, NetBanking)</Text>
          </View>
        </View>
      </ScrollView>

      <Modal transparent visible={showPickupCelebration} animationType="fade" onRequestClose={closePickupCelebration}>
        <View style={styles.celebrationOverlay}>
          {CONFETTI_PIECES.map((piece, index) => (
            <Animated.View
              key={`confetti-${index}`}
              pointerEvents="none"
              style={[
                styles.confettiPiece,
                {
                  left: piece.left,
                  width: piece.size,
                  height: piece.size * 1.7,
                  backgroundColor: piece.color,
                  opacity: confettiAnimations[index].interpolate({
                    inputRange: [0, 0.12, 0.82, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: confettiAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-60, SCREEN_HEIGHT + 40],
                      }),
                    },
                    {
                      rotate: confettiAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', piece.rotation],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
          <Animated.View
            style={[
              styles.celebrationCard,
              {
                opacity: celebrationOpacity,
                transform: [{ scale: celebrationScale }],
              },
            ]}
          >
            <Text style={styles.celebrationKicker}>Store Pickup Selected</Text>
            <Text style={styles.celebrationTitle}>WOW!</Text>
            <Text style={styles.celebrationMessage}>You Saved Delivery Charges</Text>
            <Text style={styles.celebrationSubText}>
              Please contact through WhatsApp before visiting the store: {STORE_PICKUP_DETAILS.phone}
            </Text>
            <TouchableOpacity style={styles.celebrationButton} onPress={closePickupCelebration}>
              <Text style={styles.celebrationButtonText}>Awesome</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.muted}>Total Amount</Text>
          <Text style={styles.footerTotal}>{inr(totalPrice)}</Text>
        </View>
        <TouchableOpacity style={styles.placeBtn} onPress={placeOrder} disabled={placing}>
          <Text style={styles.placeBtnText}>{placing ? 'Processing...' : 'Pay Now'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: 12 },
  addAddrPlaceHolder: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    marginTop: 10,
  },
  addAddrTitle: { fontSize: 13, fontWeight: '900', color: colors.text, letterSpacing: 1 },
  addAddrSub: { fontSize: 11, color: colors.muted, marginTop: 4 },
  section: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontWeight: '800', fontSize: 14, color: colors.text },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  input: { backgroundColor: colors.bg, borderRadius: radius.md, padding: 12, marginBottom: 10, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  fulfillmentGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  fulfillmentCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    backgroundColor: colors.bg,
    minHeight: 118,
  },
  fulfillmentCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#fdf8f1',
  },
  fulfillmentTitle: { fontSize: 13, fontWeight: '900', color: colors.text },
  fulfillmentTitleActive: { color: colors.primary },
  fulfillmentText: { fontSize: 10, color: colors.muted, fontWeight: '600', lineHeight: 15, marginTop: 6 },
  fulfillmentSelected: { fontSize: 9, color: colors.primary, fontWeight: '900', textTransform: 'uppercase', marginTop: 10 },
  pickupBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f2e8d5',
    borderRadius: radius.md,
    backgroundColor: '#fdf8f1',
    padding: 12,
  },
  pickupTitle: { fontSize: 13, fontWeight: '900', color: colors.text },
  pickupText: { fontSize: 11, color: colors.muted, fontWeight: '600', lineHeight: 17, marginTop: 6 },
  pickupHighlightBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: radius.md,
    backgroundColor: '#f0fdf4',
    padding: 10,
  },
  pickupHighlightText: { fontSize: 10, color: colors.success, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  whatsappNoticeBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f2e8d5',
    borderRadius: radius.md,
    backgroundColor: '#fff',
    padding: 10,
  },
  whatsappNoticeText: { fontSize: 10, color: colors.primary, fontWeight: '900', textTransform: 'uppercase', lineHeight: 15 },
  storeCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f2e8d5',
    borderRadius: radius.md,
    backgroundColor: '#fff',
    padding: 12,
  },
  storeLabel: { fontSize: 9, color: colors.primary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  storeName: { fontSize: 13, fontWeight: '900', color: colors.text, marginTop: 6 },
  storeText: { fontSize: 11, color: colors.muted, fontWeight: '600', lineHeight: 17, marginTop: 4 },
  storePhone: { fontSize: 11, color: colors.primary, fontWeight: '900', marginTop: 6 },
  pickupFreeText: { fontSize: 10, color: colors.success, fontWeight: '900', textTransform: 'uppercase', marginTop: 10 },
  pickupSummaryText: { fontSize: 11, color: colors.text, fontWeight: '700', lineHeight: 16 },
  celebrationOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 12, 8, 0.58)',
    padding: 24,
  },
  confettiPiece: {
    position: 'absolute',
    top: -70,
    borderRadius: 2,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f2e8d5',
  },
  celebrationKicker: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  celebrationTitle: {
    marginTop: 8,
    fontSize: 42,
    color: colors.success,
    fontWeight: '900',
    letterSpacing: 1,
  },
  celebrationMessage: {
    marginTop: 4,
    fontSize: 18,
    color: colors.text,
    fontWeight: '900',
    textAlign: 'center',
  },
  celebrationSubText: {
    marginTop: 12,
    fontSize: 11,
    color: colors.muted,
    fontWeight: '800',
    lineHeight: 17,
    textAlign: 'center',
  },
  celebrationButton: {
    marginTop: 18,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  celebrationButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  savedAddr: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 10, minWidth: 150 },
  savedAddrActive: { borderColor: colors.primary, backgroundColor: '#fdf8f1' },
  savedAddrText: { fontSize: 12, color: colors.text },
  defaultLabel: { fontSize: 9, color: colors.primary, fontWeight: '800', marginTop: 4, textTransform: 'uppercase' },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 },
  couponHint: { flex: 1, fontSize: 10, color: colors.muted, fontWeight: '700' },
  viewCouponsBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  viewCouponsBtnText: { color: colors.primary, fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  couponListBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
  },
  couponListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  couponListTitle: { fontSize: 12, fontWeight: '900', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.8 },
  couponCount: { fontSize: 10, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  couponEmpty: { fontSize: 12, color: colors.muted },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#f0e7dd',
    backgroundColor: '#fffaf4',
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 8,
  },
  couponCode: { fontSize: 14, fontWeight: '900', color: colors.text },
  couponMeta: { fontSize: 11, fontWeight: '800', color: colors.primary, marginTop: 2, textTransform: 'uppercase' },
  couponMeta2: { fontSize: 10, color: colors.muted, marginTop: 2 },
  selectCouponBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectCouponBtnText: { color: colors.accent, fontWeight: '900', fontSize: 11, textTransform: 'uppercase' },
  couponBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 16, justifyContent: 'center' },
  couponBtnText: { color: colors.accent, fontWeight: '800' },
  couponSuccess: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, padding: 10, backgroundColor: '#ecfdf5', borderRadius: radius.md },
  couponSuccessText: { color: colors.success, fontSize: 13, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryDivider: { borderTopWidth: 1, borderColor: colors.border },
  muted: { color: colors.muted, fontSize: 13 },
  val: { fontWeight: '600', color: colors.text },
  bold: { fontWeight: '700', color: colors.text },
  primaryBold: { fontWeight: '900', color: colors.primary, fontSize: 18 },
  successText: { color: colors.success, fontWeight: '600' },
  payMethod: { backgroundColor: colors.bg, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border },
  payMethodActive: { borderColor: colors.primary, backgroundColor: '#fdf8f1', borderWidth: 2 },
  footer: { flexDirection: 'row', padding: spacing.md, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  footerTotal: { fontSize: 20, fontWeight: '900', color: colors.primary },
  placeBtn: { flex: 1.5, backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginLeft: 16 },
  placeBtnText: { color: colors.accent, fontWeight: '800', fontSize: 16 },
  shippingCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    minWidth: 140,
    backgroundColor: colors.bg,
  },
  shippingCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#fdf8f1',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shippingName: { fontSize: 12, fontWeight: '700', color: colors.text },
  shippingNameActive: { color: colors.primary },
  shippingPrice: { fontSize: 16, fontWeight: '900', color: colors.primary, marginTop: 4 },
  shippingDays: { fontSize: 10, color: colors.muted, marginTop: 2, fontWeight: '500' },
  shippingDetailCard: { backgroundColor: '#fdf8f1', borderRadius: radius.lg, padding: 8, marginTop: 6, borderWidth: 1, borderColor: '#f2e8d5' },
  detailCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  detailIconWrap: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#f2e8d5', alignItems: 'center', justifyContent: 'center' },
  detailIcon: { fontSize: 8 },
  detailLabel: { fontSize: 8, fontWeight: '900', color: colors.primary, letterSpacing: 1 },
  detailGrid: { flexDirection: 'row', gap: 10 },
  detailCol: { flex: 1 },
  detailSubLabel: { fontSize: 7, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 2 },
  detailVal: { fontSize: 11, fontWeight: '900', color: '#333' },
  detailFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f2e8d5' },
  detailRateText: { fontSize: 9, fontWeight: '900', color: colors.primary },
  detailRateVal: { fontSize: 14, fontWeight: '700' },
  detailEst: { fontSize: 10, fontWeight: '700', color: '#999', letterSpacing: 1, marginTop: 2 },
});

export default CheckoutScreen;
