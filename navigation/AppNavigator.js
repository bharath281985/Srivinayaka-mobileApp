import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../app/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { cachedGet } from '../services/api';
import { registerForPushNotificationsAsync } from '../services/notifications';
import SplashScreen from '../screens/SplashScreen';
import Toast from '../components/Toast';
import OnboardingScreen from '../screens/OnboardingScreen.jsx';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

import CategoryListingScreen from '../screens/CategoryListingScreen';
import SubcategoryListingScreen from '../screens/SubcategoryListingScreen';
import ProductListingScreen from '../screens/ProductListingScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import ProductImageGalleryScreen from '../screens/ProductImageGalleryScreen';
import CartScreen from '../screens/CartScreen';
import ApplyCouponScreen from '../screens/ApplyCouponScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import AddressSelectionScreen from '../screens/AddressSelectionScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import OrderSummaryScreen from '../screens/OrderSummaryScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrderResultScreen from '../screens/OrderResultScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AddressBookScreen from '../screens/AddressBookScreen';
import SavedAddressesScreen from '../screens/SavedAddressesScreen';
import WishlistScreen from '../screens/WishlistScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import FAQScreen from '../screens/FAQScreen';
import ContactUsScreen from '../screens/ContactUsScreen';
import SearchScreen from '../screens/SearchScreen';
import FilterScreen from '../screens/FilterScreen';
import OfferProductsScreen from '../screens/OfferProductsScreen';
import RecentlyViewedProductsScreen from '../screens/RecentlyViewedProductsScreen';
import FestivalSaleScreen from '../screens/FestivalSaleScreen';
import RecommendedProductsScreen from '../screens/RecommendedProductsScreen';
import VideoSareeShowcaseScreen from '../screens/VideoSareeShowcaseScreen';
import PersonalizedRecommendationsScreen from '../screens/PersonalizedRecommendationsScreen';
import BoutiquePageScreen from '../screens/BoutiquePageScreen';
import AboutScreen from '../screens/AboutScreen';
import PaymentWebViewScreen from '../screens/PaymentWebViewScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { hydrated, token } = useAuthStore();
  const hydrate = useAuthStore((s) => s.hydrate);
  const introSeen = useAppStore((s) => s.introSeen);
  const markIntroSeen = useAppStore((s) => s.markIntroSeen);
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    hydrate();
    loadSettings();
  }, [hydrate]);

  // Register push notifications when user is authenticated
  useEffect(() => {
    if (token && hydrated) {
      registerForPushNotificationsAsync();
    }
  }, [token, hydrated]);


  const loadSettings = async () => {
    try {
      const data = await cachedGet('/api/app-management/mobile-settings', 0);
      setSettings(data);
    } catch {
      setSettings({});
    } finally {
      setLoadingSettings(false);
    }
  };

  // Skip custom splash screen and go straight to app once items are ready
  const ready = hydrated && !loadingSettings;

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1410', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#d9a441" />
      </View>
    );
  }

  if (settings?.maintenanceMode) {
    return <MaintenanceScreen message={settings.maintenanceMessage} supportPhone={settings.supportPhone} />;
  }

  if (!introSeen) return <OnboardingScreen onDone={markIntroSeen} />;

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={MainTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="CategoryListing" component={CategoryListingScreen} options={{ title: 'Categories' }} />
        <Stack.Screen name="SubcategoryListing" component={SubcategoryListingScreen} options={({ route }) => ({ title: route.params?.title || 'Subcategories' })} />
        <Stack.Screen name="ProductListing" component={ProductListingScreen} options={({ route }) => ({ title: route.params?.title || 'Products' })} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: '', headerTransparent: true }} />
        <Stack.Screen name="ProductImageGallery" component={ProductImageGalleryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'My Cart' }} />
        <Stack.Screen name="ApplyCoupon" component={ApplyCouponScreen} options={{ title: 'Apply Coupon' }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
        <Stack.Screen name="AddressSelection" component={AddressSelectionScreen} options={{ title: 'Select Address' }} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ title: 'Add Address' }} />
        <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} options={{ title: 'Order Summary' }} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OrderResult" component={OrderResultScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Order Details' }} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: 'Track Order' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
        <Stack.Screen name="AddressBook" component={AddressBookScreen} options={{ title: 'Address Book' }} />
        <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} options={{ title: 'Saved Addresses' }} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ title: 'Help & Support' }} />
        <Stack.Screen name="FAQ" component={FAQScreen} options={{ title: 'FAQ' }} />
        <Stack.Screen name="ContactUs" component={ContactUsScreen} options={{ title: 'Contact Us' }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Filter" component={FilterScreen} options={{ title: 'Sort & Filter', presentation: 'modal' }} />
        <Stack.Screen name="OfferProducts" component={OfferProductsScreen} options={{ title: 'Featured Item' }} />
        <Stack.Screen name="RecentlyViewedProducts" component={RecentlyViewedProductsScreen} options={{ title: 'Recently Viewed' }} />
        <Stack.Screen name="FestivalSale" component={FestivalSaleScreen} options={{ title: 'Bestseller' }} />
        <Stack.Screen name="RecommendedProducts" component={RecommendedProductsScreen} options={{ title: 'Recommended' }} />
        <Stack.Screen name="VideoSareeShowcase" component={VideoSareeShowcaseScreen} options={{ title: 'Video Showcase' }} />
        <Stack.Screen name="PersonalizedRecommendations" component={PersonalizedRecommendationsScreen} options={{ title: 'Just For You' }} />
        <Stack.Screen name="BoutiquePage" component={BoutiquePageScreen} options={{ title: '' }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About Us' }} />
        <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} options={{ title: 'Payment' }} />
      </Stack.Navigator>
      <Toast />
    </>
  );
};

export default AppNavigator;
