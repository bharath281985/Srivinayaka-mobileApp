import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import ProductCard from '../components/ProductCard';
import { EmptyState } from '../components/States';
import { colors, spacing, typography } from '../app/theme';

// Saved Addresses — alias of AddressBook for now
const SavedAddressesScreen = () => {
    const navigation = useNavigation();
    const addresses = useAppStore((s) => s.addresses);

    if (!addresses.length) {
        return (
            <EmptyState
                icon="📍"
                title="No saved addresses"
                subtitle="Add an address to use during checkout."
                actionText="Add Address"
                onAction={() => navigation.navigate('AddAddress')}
            />
        );
    }

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <FlatList
                data={addresses}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={<Text style={[typography.h2, { marginBottom: 14 }]}>Saved Addresses</Text>}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.addrLine}>{item.address}</Text>
                        <Text style={styles.addrLine}>{item.city}, {item.postalCode}</Text>
                        <Text style={styles.addrLine}>{item.country}</Text>
                        {item.phone && <Text style={styles.addrLine}>📞 {item.phone}</Text>}
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.md },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    addrLine: { color: colors.text, fontSize: 14, marginBottom: 2 },
});

export default SavedAddressesScreen;
