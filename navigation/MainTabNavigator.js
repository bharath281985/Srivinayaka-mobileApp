import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import HomeScreen from '../screens/HomeScreen';
import CategoryListingScreen from '../screens/CategoryListingScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthNavigator from './AuthNavigator';
import { colors, radius } from '../app/theme';

const Tab = createBottomTabNavigator();

const ICON_SIZE = 22;

const TabIcon = ({ name, nameFocused, label, focused }) => (
  <View style={tabStyles.iconContainer}>
    <View style={[tabStyles.indicator, focused && tabStyles.indicatorActive]} />
    <Ionicons
      name={focused ? nameFocused : name}
      size={ICON_SIZE}
      color={focused ? colors.primary : colors.muted}
      style={tabStyles.icon}
    />
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center', width: 72 },
  indicator: {
    position: 'absolute',
    top: -10,
    width: 28,
    height: 2,
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  indicatorActive: { backgroundColor: colors.primary },
  icon: { marginTop: 2 },
  label: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 6,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  labelActive: { color: colors.primary },
  badge: {
    position: 'absolute',
    top: -2,
    right: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDFCFB',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
});

const MainTabNavigator = () => {
  const cart = useAppStore((s) => s.cart);
  const token = useAuthStore((s) => s.token);
  const insets = useSafeAreaInsets();
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FDFCFB',
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: Platform.OS === 'ios' ? 70 + Math.max(insets.bottom, 18) : 60 + Math.max(insets.bottom, 12),
            paddingBottom: Math.max(insets.bottom, 10),
            paddingTop: 12,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 16,
          },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="home-outline" nameFocused="home" label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoryListingScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="grid-outline" nameFocused="grid" label="Categories" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon name="cart-outline" nameFocused="cart" label="Cart" focused={focused} />
              {cartCount > 0 && (
                <View style={tabStyles.badge}>
                  <Text style={tabStyles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={token ? ProfileScreen : AuthNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="person-outline" nameFocused="person" label={token ? 'Account' : 'Login'} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
