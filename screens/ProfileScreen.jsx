import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import api, { getImageUrl } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, radius, typography } from '../app/theme';

const { width: SW } = Dimensions.get('window');

const MenuSection = ({ title, children, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 400 + (index * 150),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay: 400 + (index * 150),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.sectionWrap, { opacity: fadeAnim, transform: [{ translateY }] }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionLine} />
      </View>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </Animated.View>
  );
};

const MenuItem = ({ icon, label, onPress, danger, isLast, subText }) => (
  <TouchableOpacity
    style={[styles.menuRow, isLast && { borderBottomWidth: 0 }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
      <Text style={[styles.menuIcon, danger && styles.menuIconDanger]}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {subText && <Text style={styles.menuSubLabel}>{subText}</Text>}
    </View>
    <Text style={styles.menuArrow}>→</Text>
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [ordersCount, setOrdersCount] = React.useState(0);
  const cart = useAppStore((s) => s.cart);
  const wishlist = useAppStore((s) => s.wishlist);
  const addresses = useAppStore((s) => s.addresses);
  const defaultAddr = addresses.find(a => a.isDefault) || (addresses.length > 0 ? addresses[0] : null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 8, tension: 20, useNativeDriver: true })
    ]).start();

    const loadOrders = async () => {
      try {
        const { data } = await api.get('/api/orders/myorders');
        if (Array.isArray(data)) {
          setOrdersCount(data.length);
        }
      } catch (e) {
        console.log('Error fetching orders count:', e);
      }
    };
    loadOrders();
  }, []);

  return (
    <View style={styles.fullWrap}>
      <ScrollView bounces={true} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 60, 100) }]}>

        {/* Editorial Header */}
        <Animated.View style={[styles.headerContainer, { opacity: headerAnim }]}>
          <LinearGradient
            colors={[colors.primary, '#3d3129']}
            style={styles.headerGradient}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.headerTop}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarRing}>
                    <View style={styles.avatarInner}>
                      {user?.profileImage ? (
                        <Image
                          source={{ uri: getImageUrl(user.profileImage) }}
                          style={{ width: '100%', height: '100%', borderRadius: 40 }}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={styles.avatarPlaceholder}>👤</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.statusDot} />
                </View>

                <View style={styles.userCoreInfo}>
                  <Text style={styles.userName}>{user?.name?.toUpperCase() || 'VALUED MEMBER'}</Text>
                  <Text style={styles.userMeta}>{user?.phone || 'Premium Account'}</Text>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Heritage Pass Card Replaces Quick Grid at the top now */}
          <Animated.View style={[styles.heritagePassWrap, { transform: [{ scale: cardScale }] }, { marginTop: -80, marginHorizontal: 24 }]}>
            <LinearGradient
              colors={['#C2975B', '#A67C3D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heritagePassCard}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.passTitle}>SVC Dashboard</Text>
                <Text style={{ fontSize: 18 }}>🏆</Text>
              </View>

              <View style={styles.passBody}>
                <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
                  <Text style={styles.passLabel}>ITEMS IN BAG</Text>
                  <Text style={styles.passValue}>{cart.reduce((a, b) => a + b.qty, 0).toString().padStart(2, '0')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'flex-end' }} onPress={() => navigation.navigate('MyOrders')}>
                  <Text style={styles.passLabel}>TOTAL ORDERS</Text>
                  <Text style={styles.passValue}>{ordersCount.toString().padStart(2, '0')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.passFooter}>
                <TouchableOpacity onPress={() => navigation.navigate('Wishlist')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.passFooterText}>WISHLIST: {wishlist.length.toString().padStart(2, '0')}</Text>
                  <Text style={{ color: '#fff', opacity: 0.3 }}>|</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('AddressBook')}>
                    <Text style={styles.passFooterText}>ADDRESS: {addresses.length.toString().padStart(2, '0')}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                <View style={styles.passDot} />
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        <View style={styles.bodyContent}>
          {/* Heritage Pass Card moved to top banner */}

          <MenuSection title="My Details" index={0}>
            <MenuItem
              icon="👤"
              label="Name"
              subText={user?.name || 'Not provided'}
              onPress={() => navigation.navigate('EditProfile')}
            />
            <MenuItem
              icon="✉️"
              label="Email"
              subText={user?.email || 'Add email for order updates'}
              onPress={() => navigation.navigate('EditProfile')}
            />

            <TouchableOpacity
              style={{ padding: 16, alignItems: 'center' }}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>EDIT PROFILE →</Text>
            </TouchableOpacity>
          </MenuSection>

          <MenuSection title="Orders & Curations" index={1}>
            <MenuItem
              icon="📦"
              label="My Orders"
              subText="Track your deliveries"
              onPress={() => navigation.navigate('MyOrders')}
              isLast
            />
          </MenuSection>

          <MenuSection title="Settings & About" index={2}>
            <MenuItem
              icon="📍"
              label="My Addresses"
              subText={defaultAddr ? `${defaultAddr.addressType || 'Default'}: ${defaultAddr.address.substring(0, 30)}...` : "Manage your delivery locations"}
              onPress={() => navigation.navigate('AddressBook')}
            />
            <MenuItem
              icon="📜"
              label="About Us"
              subText="Our story, philosophy & atelier"
              onPress={() => navigation.navigate('About')}
            />
            <MenuItem icon="🚚" label="Shipping Policy" onPress={() => navigation.navigate('BoutiquePage', { slug: 'shipping-policy' })} />
            <MenuItem icon="🔄" label="Returns Policy" onPress={() => navigation.navigate('BoutiquePage', { slug: 'returns-policy' })} />
            <MenuItem icon="🛡️" label="Privacy Policy" onPress={() => navigation.navigate('BoutiquePage', { slug: 'privacy-policy' })} />
            <MenuItem icon="📜" label="Terms & Conditions" onPress={() => navigation.navigate('BoutiquePage', { slug: 'terms-and-conditions' })} />
            <MenuItem icon="📞" label="Help & Support" subText="24/7 Customer Support" isLast onPress={() => navigation.navigate('HelpSupport')} />
          </MenuSection>

          <MenuSection title="Account" index={3}>
            <MenuItem icon="🗑️" label="Delete Account" subText="Permanently remove your data" danger isLast onPress={() => navigation.navigate('BoutiquePage', { slug: 'delete-account' })} />
          </MenuSection>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutTxt}>LOGOUT</Text>
          </TouchableOpacity>

          <View style={styles.footerInfo}>
            <Image source={{ uri: getImageUrl('/uploads/logo_luxe.png') }} style={{ width: 40, height: 40, marginBottom: 10 }} contentFit="contain" />
            <Text style={styles.footerLogo}>SRI VINAYAKA COLLECTIONS</Text>
            <Text style={styles.versionTxt}>Version 1.0.8</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullWrap: { flex: 1, backgroundColor: '#fdfdfb' },
  scrollContent: { paddingBottom: 40 },

  headerContainer: { backgroundColor: '#fdfdfb', paddingBottom: 20 },
  headerGradient: {
    paddingBottom: 100,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20
  },
  avatarContainer: { position: 'relative' },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(217, 164, 65, 0.4)',
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: { fontSize: 32 },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#0f172a',
  },

  userCoreInfo: { marginLeft: 20, flex: 1 },
  userName: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  statusChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 164, 65, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 164, 65, 0.3)',
  },
  statusText: { color: '#d9a441', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  userMeta: { fontSize: 13, color: '#94a3b8', marginTop: 10, fontWeight: '500' },

  luxeCardWrap: {
    marginTop: -80,
    paddingHorizontal: 24,
    shadowColor: '#b8860b',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  luxeCard: {
    height: 170,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  luxeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  luxeCardTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 3, opacity: 0.9 },
  luxeCardLogo: { fontSize: 28, color: '#fff', opacity: 0.8 },
  luxeCardBody: { flexDirection: 'row', justifyContent: 'space-between' },
  luxeFieldLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  luxeFieldValue: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardFooterText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  sparkle: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', shadowColor: '#fff', shadowRadius: 10, shadowOpacity: 1 },

  bodyContent: { paddingHorizontal: 20, marginTop: 12 },

  heritagePassWrap: {
    marginBottom: 0,
    shadowColor: '#A67C3D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  heritagePassCard: {
    padding: 24,
    borderRadius: 32,
    height: (SW - 40) * 0.6,
    justifyContent: 'space-between',
  },
  passTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 4,
    opacity: 0.9,
  },
  passBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  passLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  passValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  passFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passFooterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.9,
  },
  passDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowRadius: 6,
    shadowOpacity: 0.8,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  quickCard: {
    width: (SW - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f1f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  quickIcon: { fontSize: 20, marginBottom: 8 },
  quickVal: { fontSize: 22, fontWeight: '900', color: '#1a1a1a' },
  quickLabel: { fontSize: 9, color: '#888', marginTop: 4, fontWeight: '800', letterSpacing: 1.5 },

  sectionWrap: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: '#111', textTransform: 'uppercase', letterSpacing: 1.5 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#f1f1f1', marginLeft: 16 },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f1f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fafafa',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f8f9fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerDanger: { backgroundColor: '#fff1f0' },
  menuIcon: { fontSize: 20 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  menuSubLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  menuLabelDanger: { color: '#ef4444' },
  menuArrow: { fontSize: 14, color: '#cbd5e1', fontWeight: 'bold' },

  logoutBtn: {
    marginTop: 8,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#fcfcfc',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
  },
  logoutTxt: { color: colors.primaryLight, fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },

  footerInfo: { marginTop: 40, alignItems: 'center' },
  footerLogo: { fontSize: 14, color: '#cbd5e1', fontWeight: '800', letterSpacing: 4 },
  versionTxt: { marginTop: 12, color: '#e2e8f0', fontSize: 10, fontWeight: '600', letterSpacing: 1 },
});

export default ProfileScreen;
