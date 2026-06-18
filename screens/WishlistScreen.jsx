import React from 'react';
import { FlatList, View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { useNavigation } from '@react-navigation/native';
import ProductCard from '../components/ProductCard';
import { EmptyState } from '../components/States';
import { colors, spacing, typography } from '../app/theme';

const WishlistScreen = () => {
  const navigation = useNavigation();
  const wishlist = useAppStore((s) => s.wishlist);
  const toggleWishlist = useAppStore((s) => s.toggleWishlist);

  if (!wishlist.length) {
    return (
      <EmptyState
        icon="🤍"
        title="Your wishlist is empty"
        subtitle="Tap the heart on any saree to save it here."
        actionText="Browse Sarees"
        onAction={() => navigation.navigate('Home')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={[typography.h2, { marginBottom: 14 }]}>Wishlist ({wishlist.length})</Text>}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: 10 },
});

export default WishlistScreen;
