import React, { useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../app/theme';

const PaymentWebViewScreen = ({ route, navigation }) => {
  const { paymentUrl, orderId } = route.params || {};
  const clearCart = useAppStore((s) => s.clearCart);
  const [handled, setHandled] = useState(false);
  const webViewRef = useRef(null);

  const handleUrl = (url) => {
    if (!url || handled) return false;

    if (url.includes('/payment/success')) {
      setHandled(true);
      clearCart();
      navigation.replace('OrderResult', { orderId, status: 'success' });
      return true;
    }

    if (url.includes('/payment/failure')) {
      setHandled(true);
      navigation.replace('OrderResult', { orderId, status: 'failure' });
      return true;
    }

    return false;
  };

  if (!paymentUrl) return null;

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
        onNavigationStateChange={(navState) => {
          handleUrl(navState.url);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default PaymentWebViewScreen;
