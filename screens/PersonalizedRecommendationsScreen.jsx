import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { cachedGet } from '../services/api';
import ProductCard from '../components/ProductCard';
import { EmptyState, ErrorState } from '../components/States';
import SkeletonCard from '../components/SkeletonCard';
import { colors, spacing, typography } from '../app/theme';

const PersonalizedRecommendationsScreen = () => {
    const navigation = useNavigation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cachedGet('/api/products', 10000, { params: { sort: 'rating', limit: 20 } })
            .then((data) => setProducts(Array.isArray(data) ? data : []))
            .catch(() => setError('Could not load recommendations.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <View style={[styles.wrap, { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: 10 }]}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </View>
    );
    if (error) return <ErrorState message={error} />;
    if (!products.length) return <EmptyState icon="✨" title="No recommendations yet" />;

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <FlatList
                data={products}
                keyExtractor={(item) => item._id}
                numColumns={2}
                columnWrapperStyle={{ gap: 10 }}
                contentContainerStyle={styles.list}
                ListHeaderComponent={<Text style={[typography.h2, { marginBottom: 14 }]}>✨ Just For You</Text>}
                renderItem={({ item }) => (
                    <View style={{ flex: 1 }}>
                        <ProductCard product={item} onPress={() => navigation.navigate('ProductDetails', { productId: item._id })} />
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

export default PersonalizedRecommendationsScreen;
