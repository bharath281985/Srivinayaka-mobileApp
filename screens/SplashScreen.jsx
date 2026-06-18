import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { getImageUrl } from '../services/api';
import { colors } from '../app/theme';

const SplashScreen = ({ onReady }) => {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.95);
  const progressAnim = new Animated.Value(0);

  useEffect(() => {
    // Unify all animations to start immediately and together
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.spring(scale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: false }),
      Animated.timing(progressAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
    ]).start();

    const timer = setTimeout(() => {
      onReady?.();
    }, 2500); // 2.5 seconds total for a premium feel

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrap}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1410" />
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logoImg}
          contentFit="contain"
        />
        <Text style={styles.brand}>SRI VINAYAKA</Text>
        <Text style={styles.tagline}>THE ART OF TIMELESS DRAPES</Text>
        <View style={styles.loadingLine}>
          <Animated.View style={[styles.progress, { width: progressWidth }]} />
        </View>
      </Animated.View>
      <Text style={styles.footer}>ESTABLISHED 2026</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#1a1410',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center' },
  logoImg: { width: 120, height: 120, marginBottom: 20 },
  brand: { fontSize: 32, fontWeight: '900', color: '#d9a441', letterSpacing: 4 },
  tagline: { color: 'rgba(217, 164, 65, 0.6)', marginTop: 12, fontSize: 10, fontWeight: '800', letterSpacing: 3 },
  loadingLine: {
    width: 200,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 40,
    borderRadius: 1,
    overflow: 'hidden'
  },
  progress: {
    height: '100%',
    backgroundColor: '#d9a441',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2
  }
});

export default SplashScreen;
