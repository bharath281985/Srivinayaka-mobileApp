import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../app/theme';
import { useAppStore } from '../store/useAppStore';

const SORTS = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Top Rated', value: 'rating' },
];

const FilterScreen = ({ route }) => {
    const navigation = useNavigation();
    const { onApply } = route.params || {};
    const [selectedSort, setSelectedSort] = useState('newest');

    const apply = () => {
        // Pass selected filters back
        onApply?.({ sort: selectedSort });
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[typography.h2, { marginBottom: spacing.md }]}>Sort & Filter</Text>

                <Text style={styles.sectionTitle}>Sort By</Text>
                {SORTS.map((s) => (
                    <TouchableOpacity
                        key={s.value}
                        style={[styles.option, selectedSort === s.value && styles.optionActive]}
                        onPress={() => setSelectedSort(s.value)}
                    >
                        <Text style={[styles.optionText, selectedSort === s.value && styles.optionTextActive]}>{s.label}</Text>
                        {selectedSort === s.value && <Text style={styles.check}>✓</Text>}
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={styles.footer}>
                <TouchableOpacity style={styles.resetBtn} onPress={() => setSelectedSort('newest')}>
                    <Text style={styles.resetText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={apply}>
                    <Text style={styles.applyText}>Apply</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.md },
    sectionTitle: { fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700', marginBottom: 10, marginTop: 8 },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 14,
        marginBottom: 6,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    optionActive: { borderColor: colors.primary, backgroundColor: '#fff4f2' },
    optionText: { fontWeight: '600', color: colors.text },
    optionTextActive: { color: colors.primary },
    check: { color: colors.primary, fontWeight: '800' },
    footer: {
        flexDirection: 'row',
        gap: 10,
        padding: spacing.md,
        borderTopWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    resetBtn: { flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: 13, alignItems: 'center' },
    resetText: { fontWeight: '700', color: colors.text },
    applyBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: radius.md, padding: 13, alignItems: 'center' },
    applyText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default FilterScreen;
