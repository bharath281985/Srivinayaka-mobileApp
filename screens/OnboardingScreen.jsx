import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuthStore } from '../store/useAuthStore';
import { colors, spacing, radius } from '../app/theme';

const { width: SW, height: SH } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'heritage',
    eyebrow: 'Sri Vinayaka Collections',
    title: 'Luxury Sarees, Curated for You',
    body: 'Handpicked drapes that blend heritage craftsmanship with modern elegance—crafted to make every moment unforgettable.',
    accent: 'LUXURY CURATION',
    gradient: ['#1A1410', '#3A2B21'],
    icon: 'SV',
    meta: ['Handpicked', 'Heritage Craft'],
  },
  {
    key: 'modern',
    eyebrow: 'Sri Vinayaka Collections',
    title: 'Redefine Your Saree Style',
    body: 'From timeless classics to contemporary designs, explore a collection that celebrates your unique elegance.',
    accent: 'MODERN MINIMAL',
    gradient: ['#2B1D16', '#6E4B32'],
    icon: '02',
    meta: ['Modern Picks', 'Timeless Icons'],
  },
  {
    key: 'royal',
    eyebrow: 'Sri Vinayaka Collections',
    title: 'Where Tradition Meets Grace',
    body: 'Discover sarees inspired by rich Indian heritage, designed to bring out your inner royalty.',
    accent: 'ROYAL HERITAGE',
    gradient: ['#2A1B14', '#7A4E2B'],
    icon: '03',
    meta: ['Regal Drapes', 'Indian Heritage'],
  },
];

const Slide = ({ item }) => (
  <LinearGradient colors={item.gradient} style={styles.slide}>
    <View style={styles.overlay} />

    <SafeAreaView style={styles.slideInner}>
      <View style={styles.topBrand}>
        <Image source={require('../assets/logo.png')} style={styles.logo} contentFit="contain" />
        <Text style={styles.brandLabel}>{item.eyebrow.toUpperCase()}</Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.badgeRow}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconBadgeText}>{item.icon}</Text>
          </View>
          <Text style={styles.accentText}>{item.accent}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>

        <View style={styles.metaWrap}>
          {item.meta.map((entry) => (
            <View key={entry} style={styles.metaPill}>
              <Text style={styles.metaText}>{entry}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>Designed for a more elegant way to browse.</Text>
      </View>
    </SafeAreaView>
  </LinearGradient>
);

const OnboardingScreen = ({ onDone }) => {
  const finishOnboarding = useAuthStore((s) => s.finishOnboarding);
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const complete = () => {
    if (onDone) {
      onDone();
      return;
    }
    finishOnboarding();
  };

  const handleNext = () => {
    if (index === SLIDES.length - 1) {
      complete();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <Slide item={item} />}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SW);
          setIndex(nextIndex);
        }}
      />

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.dots}>
          {SLIDES.map((slide, dotIndex) => (
            <View
              key={slide.key}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={complete}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cta} onPress={handleNext}>
            <Text style={styles.ctaText}>
              {index === SLIDES.length - 1 ? 'Enter App' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#120E0B',
  },
  slide: {
    width: SW,
    height: SH,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  slideInner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 140,
    justifyContent: 'space-between',
  },
  topBrand: {
    alignItems: 'center',
    marginTop: 12,
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 12,
  },
  brandLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.6,
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 28,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBadgeText: {
    color: '#F5E6D0',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  accentText: {
    color: '#F1D1A6',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 14,
  },
  body: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  metaText: {
    color: '#FFF7EC',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  footerNote: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  footerNoteText: {
    color: 'rgba(255,255,255,0.62)',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.4,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  dotActive: {
    width: 28,
    backgroundColor: '#F1D1A6',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18,14,11,0.72)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  skip: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    fontWeight: '700',
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  ctaText: {
    color: '#2B1F16',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});

export default OnboardingScreen;
