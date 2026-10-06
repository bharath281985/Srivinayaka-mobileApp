import React, { useRef, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Linking, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../app/theme';

const PAYMENT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const PaymentWebViewScreen = ({ route, navigation }) => {
  const { paymentUrl, orderId } = route.params || {};
  const clearCart = useAppStore((s) => s.clearCart);
  const handledRef = useRef(false);
  const webViewRef = useRef(null);
  const [timedOut, setTimedOut] = useState(false);

  // Auto-cancel payment after 10 minutes of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!handledRef.current) {
        handledRef.current = true;
        console.log('[Payment] ⏰ Payment timed out after 10 minutes');
        setTimedOut(true);
        navigation.replace('OrderResult', { orderId, status: 'timeout' });
      }
    }, PAYMENT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [navigation, orderId]);

  // UPI providers leave the gateway using an app URL (for example tez:// or
  // phonepe://). A WebView cannot load those URLs itself, so hand them to the
  // operating system and keep the WebView open for the payment callback.
  const openPaymentApp = async (url) => {
    let appUrl = url;

    console.log('[Payment] 🔗 RAW URL received from gateway:', url);

    // Android gateways commonly use intent:// URLs. React Native's Linking
    // expects the actual app scheme, while Android WebView normally parses the
    // Intent format internally.
    if (url.startsWith('intent://')) {
      const scheme = url.match(/;scheme=([^;]+)/)?.[1];
      const path = url.slice('intent:'.length).split('#Intent;')[0];
      if (scheme) appUrl = `${scheme}:${path}`;
      console.log('[Payment] 🔄 Converted intent:// to app scheme:', appUrl);
    }

    console.log('[Payment] 🚀 Final URL being sent to Linking.openURL:', appUrl);

    try {
      await Linking.openURL(appUrl);
      console.log('[Payment] ✅ Linking.openURL called successfully');
    } catch (error) {
      console.warn('[Payment] ❌ Unable to open selected payment app:', error);
      Alert.alert(
        'UPI app unavailable',
        'The selected UPI app could not be opened. Please install it or choose another payment method.'
      );
    }
  };

  const handleUrl = (url) => {
    if (!url || handledRef.current) return false;

    if (url.includes('/payment/success')) {
      handledRef.current = true;
      clearCart();

      let finalOrderId = orderId;
      if (!finalOrderId) {
        const match = url.match(/[?&]orderId=([^&]+)/);
        if (match) {
          finalOrderId = match[1];
        }
      }

      navigation.replace('OrderResult', { orderId: finalOrderId, status: 'success' });
      return true;
    }

    if (url.includes('/payment/failure')) {
      handledRef.current = true;

      let finalOrderId = orderId;
      if (!finalOrderId) {
        const match = url.match(/[?&]orderId=([^&]+)/);
        if (match) {
          finalOrderId = match[1];
        }
      }

      navigation.replace('OrderResult', { orderId: finalOrderId, status: 'failure' });
      return true;
    }

    return false;
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment?',
      'Your cart is still saved. You can retry anytime.',
      [
        { text: 'Continue Payment', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            if (!handledRef.current) {
              handledRef.current = true;
              console.log('[Payment] 🚫 User cancelled payment');
              navigation.replace('OrderResult', { orderId, status: 'failure' });
            }
          },
        },
      ]
    );
  };

  if (!paymentUrl || timedOut) return null;

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      {/* Header bar with cancel button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.cancelText}>✕ Cancel</Text>
        </TouchableOpacity>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        originWhitelist={['*']}
        sharedCookiesEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
        onNavigationStateChange={(navState) => {
          handleUrl(navState.url);
        }}
        onShouldStartLoadWithRequest={(request) => {
          console.log('[Payment] 📍 WebView navigating to:', request.url);

          const processed = handleUrl(request.url);
          if (processed) return false;

          // Permit gateway pages in the WebView, but never attempt to load a
          // third-party payment-app scheme there.
          if (!/^https?:/i.test(request.url)) {
            console.log('[Payment] ⚡ Non-http URL intercepted, handing to OS:', request.url);
            openPaymentApp(request.url);
            return false;
          }

          return true;
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff0f0',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default PaymentWebViewScreen;
