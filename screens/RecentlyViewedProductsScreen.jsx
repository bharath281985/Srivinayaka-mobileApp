import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import ProductCard from '../components/ProductCard';
import { EmptyState } from '../components/States';
import { colors, spacing, typography } from '../app/theme';

const RecentlyViewedProductsScreen = () => {
  const navigation = useNavigation();
  const recentlyViewed = useAppStore((s) => s.recentlyViewed);

  if (!recentlyViewed.length) {
    return (
      <EmptyState
        icon="👁️"
        title="No recently viewed"
        subtitle="Products you view will appear here."
        actionText="Browse Sarees"
        onAction={() => navigation.navigate('Home')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']}>
      <FlatList
        data={recentlyViewed}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={[typography.h2, { marginBottom: 14 }]}>Recently Viewed</Text>}
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

export default RecentlyViewedProductsScreen;
