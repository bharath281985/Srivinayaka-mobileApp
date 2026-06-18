import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => { /* nothing */ });

const AppRoot = () => {
  const hydrateApp = useAppStore((s) => s.hydrateApp);

  useEffect(() => {
    (async () => {
      try {
        await hydrateApp();
        // Hide native splash once JS environment is ready
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
        await SplashScreen.hideAsync();
      }
    })();
    
    // Check for OTA updates silently in the background
    async function updateApp() {
      try {
        const Updates = await import('expo-updates');
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        // App is likely in development mode
      }
    }
    updateApp();
  }, []);

  const linking = {
    prefixes: ['saree-studio://'],
    config: {
      screens: {
        Main: {
          path: 'main',
          screens: {
            Home: 'home',
          }
        },
        ProductDetails: 'product/:id',
        CategoryListing: 'category/:categoryId',
        SubcategoryListing: 'subcategory/:subcategoryId',
      },
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default AppRoot;
