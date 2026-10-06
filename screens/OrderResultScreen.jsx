import React from 'react';
import { Animated, Dimensions, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../app/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONFETTI_COLORS = ['#16a34a', '#f59e0b', '#ef4444', '#2563eb', '#db2777', '#7c3aed'];
const CONFETTI_PIECES = Array.from({ length: 42 }, (_, index) => ({
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  delay: (index % 9) * 80,
  duration: 1300 + (index % 6) * 140,
  left: 10 + ((index * 31) % Math.max(90, SCREEN_WIDTH - 30)),
  rotation: index % 2 === 0 ? '220deg' : '-220deg',
  size: 7 + (index % 5),
}));

const OrderResultScreen = ({ route, navigation }) => {
  const { orderId, status = 'success' } = route.params || {};
  const isSuccess = status === 'success';
  const isTimeout = status === 'timeout';
  const flip = React.useRef(new Animated.Value(0)).current;
  const blast = React.useRef(new Animated.Value(0)).current;
  const confettiAnimations = React.useRef(CONFETTI_PIECES.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    Animated.spring(flip, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    if (!isSuccess) return;

    blast.setValue(0);
    confettiAnimations.forEach((anim) => anim.setValue(0));
    Animated.parallel([
      Animated.spring(blast, {
        toValue: 1,
        friction: 5,
        tension: 80,
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
  }, [blast, confettiAnimations, flip, isSuccess]);

  const successIconScale = isSuccess
    ? Animated.multiply(flip, blast.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.12] }))
    : flip;

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: colors.primary }]} edges={['top', 'bottom']}>
      {isSuccess && (
        <View pointerEvents="none" style={styles.confettiLayer}>
          {CONFETTI_PIECES.map((piece, index) => (
            <Animated.View
              key={`success-confetti-${index}`}
              style={[
                styles.confettiPiece,
                {
                  left: piece.left,
                  width: piece.size,
                  height: piece.size * 1.8,
                  backgroundColor: piece.color,
                  opacity: confettiAnimations[index].interpolate({
                    inputRange: [0, 0.1, 0.82, 1],
                    outputRange: [0, 1, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: confettiAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-80, SCREEN_HEIGHT + 80],
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
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Animated.View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isSuccess ? '#22c55e' : '#ef4444',
                transform: [{ scale: successIconScale }],
              },
            ]}
          >
            <Text style={styles.icon}>{isSuccess ? '✓' : 'x'}</Text>
          </Animated.View>
          <Text style={styles.title}>
            {isSuccess ? 'Payment Successful!' : isTimeout ? 'Payment Timed Out' : 'Payment Failed'}
          </Text>
          <Text style={styles.subtitle}>
            {isSuccess ? 'Celebration unlocked' : isTimeout ? 'Session expired' : 'Transaction incomplete'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoSection}>
            <Text style={styles.label}>ORDER REFERENCE</Text>
            <Text style={styles.orderId}>#{orderId?.slice(-8).toUpperCase() || 'COLLECTION-LOCKED'}</Text>
          </View>

          <View style={styles.buttons}>
            {isSuccess ? (
              <>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => navigation.navigate('MyOrders')}>
                  <Text style={styles.btnText}>VIEW ORDERS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => navigation.navigate('Home')}>
                  <Text style={[styles.btnText, { color: colors.primary }]}>BACK TO SHOP</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Cart')}>
                  <Text style={styles.btnText}>RETRY FROM CART</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnOutline, { borderColor: colors.primary }]} onPress={() => navigation.navigate('ContactUs')}>
                  <Text style={[styles.btnText, { color: colors.primary }]}>GET SUPPORT</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {isSuccess ? (
            <View style={styles.successBlastNote}>
              <Text style={styles.successBlastTitle}>WOW! Payment successful</Text>
              <Text style={styles.successBlastText}>Your order is confirmed. A confirmation email has been sent with your order details.</Text>
            </View>
          ) : isTimeout ? (
            <View style={styles.timeoutNote}>
              <Text style={styles.timeoutTitle}>⏰ Session Expired</Text>
              <Text style={styles.timeoutText}>Your cart is still saved. You can go back to checkout and retry the payment anytime.</Text>
            </View>
          ) : (
            <Text style={styles.footerNote}>No funds were deducted. If they were, they will be refunded shortly.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center' },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    elevation: 5,
  },
  confettiPiece: {
    position: 'absolute',
    top: -90,
    borderRadius: 2,
  },
  header: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  icon: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 10, fontWeight: '800', color: '#fff', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 40,
    alignItems: 'center',
  },
  infoSection: { alignItems: 'center', marginBottom: 40 },
  label: { fontSize: 10, fontWeight: '900', color: '#666', letterSpacing: 1.5, marginBottom: 8 },
  orderId: { fontSize: 28, fontWeight: '900', color: colors.primary, letterSpacing: 1 },
  buttons: { width: '100%', gap: 14, marginBottom: 30 },
  btn: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: { borderWidth: 2, borderColor: colors.primary, backgroundColor: '#fff' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  successBlastNote: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    padding: 16,
    alignItems: 'center',
  },
  successBlastTitle: { color: '#15803d', fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  successBlastText: { color: '#166534', fontSize: 11, fontWeight: '700', lineHeight: 17, marginTop: 8, textAlign: 'center' },
  footerNote: { fontSize: 10, color: '#999', textAlign: 'center', fontStyle: 'italic', lineHeight: 16 },
  timeoutNote: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 22,
    backgroundColor: '#fff7ed',
    padding: 16,
    alignItems: 'center',
  },
  timeoutTitle: { color: '#c2410c', fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  timeoutText: { color: '#9a3412', fontSize: 11, fontWeight: '700', lineHeight: 17, marginTop: 8, textAlign: 'center' },
});

export default OrderResultScreen;
