import React, { useRef, useEffect, useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../app/theme';
import { getImageUrl } from '../services/api';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_W = SCREEN_W - 32;

const BannerCarousel = ({ banners = [] }) => {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [sideImgIdx, setSideImgIdx] = useState(0);
  const sideImages = banners[activeIdx]?.sideImageUrls || [];

  // Main Banner Auto-play
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeIdx + 1) % banners.length;
      scrollRef.current?.scrollTo({ x: next * BANNER_W, animated: true });
      setActiveIdx(next);
      setSideImgIdx(0);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, activeIdx]);

  // Side Image Auto-change
  useEffect(() => {
    if (!sideImages.length) return;
    const timer = setInterval(() => {
      setSideImgIdx((prev) => (prev + 1) % sideImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [sideImages.length, activeIdx]);

  if (!banners.length) return null;

  const handlePress = (banner) => {
    // Priority: If the banner text mentions "Collection" or "Saree", go to Categories.
    // Or if the link specifically has "products" in it.
    const url = (banner.linkUrl || '').toLowerCase();

    if (url.includes('/products') || !banner.linkUrl || banner.title?.toLowerCase().includes('collection')) {
      navigation.navigate('CategoryListing');
    } else if (url.startsWith('http')) {
      // Only open external URL if it doesn't look like an internal collection link
      Linking.openURL(banner.linkUrl).catch(() => { });
    } else {
      navigation.navigate('CategoryListing');
    }
  };

  return (
    <View style={[styles.container, { paddingHorizontal: 16 }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={BANNER_W + 12} // + gap
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12));
          setActiveIdx(idx);
          setSideImgIdx(0);
        }}
        contentContainerStyle={{ gap: 12 }}
      >
        {banners.map((b, i) => (
          <TouchableOpacity
            key={b._id || i}
            onPress={() => handlePress(b)}
            activeOpacity={0.9}
            style={styles.item}
          >
            <Image
              source={{ uri: b.imageUrl }}
              style={styles.image}
              contentFit="fill"
              cachePolicy="memory-disk"
            />


            <View style={styles.contentRow}>
              <View style={styles.textOverlay}>
                <Text style={styles.subtitle}>
                  {'SRI VINAYAKA COLLECTIONS'}
                </Text>
                <Text 
                  style={styles.title} 
                  numberOfLines={3} 
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {'Tradition Meets Style\nExplore our\nOur Saree collections'}
                </Text>
                {/* Paragraph replaced by Shop Button */}
                <View style={styles.shopBtn}>
                  <Text style={styles.shopBtnText}>EXPLORE →</Text>
                </View>
              </View>

              {/* Side Floating Image with Transition */}
              {(b.sideImageUrl || (b.sideImageUrls && b.sideImageUrls.length > 0)) && (
                <View style={styles.sideFrame}>
                  {b.sideImageUrls && b.sideImageUrls.length > 0 ? (
                    b.sideImageUrls.map((img, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: img }}
                        style={[
                          styles.sideImg,
                          {
                            position: 'absolute',
                            opacity: i === activeIdx && idx === sideImgIdx ? 1 : 0
                          }
                        ]}
                        contentFit="fill"
                        transition={500}
                      />
                    ))
                  ) : (
                    <Image
                      source={{ uri: b.sideImageUrl }}
                      style={styles.sideImg}
                      contentFit="fill"
                    />
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dots removed for absolute compactness */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 0 },
  item: {
    width: BANNER_W,
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1410',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    })
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 5,
    alignItems: 'center',
  },
  textOverlay: {
    flex: 2.0,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  sideFrame: {
    flex: 1.3,
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    transform: [{ rotate: '2deg' }],
    backgroundColor: '#333',
    marginLeft: 8,
    position: 'relative',
  },
  sideImg: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    color: '#A67C3D',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: SCREEN_W < 380 ? 15 : 18,
    fontWeight: '900',
    lineHeight: SCREEN_W < 380 ? 18 : 22,
    marginBottom: 4,
  },
  description: { display: 'none' },
  shopBtn: {
    backgroundColor: '#8C6246',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  shopBtnText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 4,
    alignItems: 'center',
    gap: 4
  },
  dot: {
    height: 2,
    borderRadius: 2,
    backgroundColor: '#ccc',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#d9a441',
  },
  dotInactive: {
    width: 2,
    opacity: 0.3
  },
});

export default BannerCarousel;
