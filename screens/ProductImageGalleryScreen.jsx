import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');

const ProductImageGalleryScreen = ({ route, navigation }) => {
  const { images = [], startIndex = 0 } = route.params || {};
  const [active, setActive] = useState(startIndex);

  return (
    <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <Image
        source={images[active] || 'https://via.placeholder.com/400x600?text=Saree'}
        style={styles.mainImage}
        contentFit="fill"
        cachePolicy="memory-disk"
      />

      <Text style={styles.counter}>{active + 1} / {images.length}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#111' },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  mainImage: { flex: 1, width: SW },
  counter: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingVertical: 10 },
});

export default ProductImageGalleryScreen;
