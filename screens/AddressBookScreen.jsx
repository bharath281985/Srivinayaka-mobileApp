import React from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { EmptyState } from '../components/States';
import { colors, spacing, radius, typography } from '../app/theme';

const AddressItem = ({ item, index, navigation, setDefault, confirmDelete, deliveryByRapido }) => {
    const fade = React.useRef(new Animated.Value(0)).current;
    const slide = React.useRef(new Animated.Value(20)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }),
            Animated.spring(slide, { toValue: 0, friction: 8, tension: 30, delay: index * 100, useNativeDriver: true })
        ]).start();
    }, []);

    return (
        <Animated.View style={[
            styles.card, 
            item.isDefault && styles.cardDefault,
            { opacity: fade, transform: [{ translateY: slide }] }
        ]}>
            <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => !item.isDefault && setDefault(item.id)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeIcon}>{item.addressType === 'Office' ? '🏢' : item.addressType === 'Home' ? '🏠' : '📍'}</Text>
                        <Text style={styles.typeText}>{item.addressType || 'Other'}</Text>
                    </View>
                    {item.isDefault && <View style={styles.badge}><Text style={styles.badgeText}>Default Selection</Text></View>}
                </View>

                <View style={styles.cardMain}>
                    <Text style={styles.addrText}>{item.address}</Text>
                    <Text style={styles.locText}>{item.city}, {item.postalCode}</Text>
                    <View style={styles.phoneRow}>
                        <Text style={styles.phoneIcon}>📞</Text>
                        <Text style={styles.phoneText}>{item.phone}</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={styles.actions}>
                <View style={styles.actionGroup}>
                    {!item.isDefault && (
                        <TouchableOpacity style={styles.altBtn} onPress={() => setDefault(item.id)}>
                            <Text style={styles.altBtnText}>Set Default</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('AddAddress', { addressToEdit: item, deliveryByRapido })}>
                        <Text style={styles.editBtnText}>Edit Details</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.delBtn} onPress={() => confirmDelete(item.id)}>
                    <Text style={styles.delBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const AddressBookScreen = ({ route, navigation }) => {
    const { deliveryByRapido = false } = route.params || {};
    const addresses = useAppStore((s) => s.addresses);
    const removeAddress = useAppStore((s) => s.removeAddress);
    const setDefault = useAppStore((s) => s.setDefaultAddress);

    const confirmDelete = (id) => {
        Alert.alert('Delete Address', 'This address will be removed from your profile.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeAddress(id) },
        ]);
    };

    if (!addresses.length) {
        return (
            <EmptyState
                icon="📍"
                title="Your address book is empty"
                subtitle="Add your home or office address for faster checkout."
                actionText="+ Add New Address"
                onAction={() => navigation.navigate('AddAddress', { deliveryByRapido })}
            />
        );
    }

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <FlatList
                data={addresses}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={typography.h2}>My Addresses</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AddAddress', { deliveryByRapido })}>
                            <Text style={styles.addText}>+ Add New</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <AddressItem 
                        item={item} 
                        index={index} 
                        navigation={navigation} 
                        setDefault={setDefault} 
                        confirmDelete={confirmDelete} 
                        deliveryByRapido={deliveryByRapido}
                    />
                )}
            />

            {/* Sticky Continue Button */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.continueBtn} 
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.continueBtnText}>CONTINUE TO CHECKOUT</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: '#fff' },
    list: { padding: spacing.md, paddingBottom: 60 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'baseline', 
        marginTop: 20,
        marginBottom: 32,
        paddingHorizontal: 4
    },
    addText: { 
        color: colors.primary, 
        fontWeight: '900', 
        fontSize: 12, 
        letterSpacing: 1,
        textTransform: 'uppercase',
        backgroundColor: '#fdf8f1',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#fdf0da'
    },
    card: { 
        backgroundColor: '#fff', 
        borderRadius: 24, 
        padding: 24, 
        marginBottom: 20, 
        borderWidth: 1, 
        borderColor: '#f1f1f1',
        shadowColor: '#111',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 2,
    },
    cardDefault: { borderColor: colors.primary, backgroundColor: '#fffcfb', shadowOpacity: 0.08, shadowColor: colors.primary },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeIcon: { fontSize: 16 },
    typeText: { fontSize: 12, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
    badge: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    cardMain: { marginBottom: 24 },
    addrText: { fontSize: 17, fontWeight: '900', color: '#111', marginBottom: 8, lineHeight: 22 },
    locText: { color: '#666', fontSize: 14, marginBottom: 12, fontWeight: '500' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    phoneIcon: { fontSize: 14, opacity: 0.6 },
    phoneText: { color: '#111', fontSize: 14, fontWeight: '700' },
    actions: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: 20, 
        borderTopWidth: 1, 
        borderColor: '#f5f5f5' 
    },
    actionGroup: { flexDirection: 'row', gap: 12 },
    altBtn: { paddingVertical: 6 },
    altBtnText: { color: colors.primaryLight, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    editBtn: { paddingVertical: 6 },
    editBtnText: { color: '#111', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    delBtn: { paddingVertical: 6 },
    delBtnText: { color: colors.danger, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
    footer: {
        padding: spacing.md,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderColor: '#f1f1f1',
        paddingBottom: 20
    },
    continueBtn: {
        backgroundColor: colors.primary,
        padding: 18,
        borderRadius: radius.md,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    continueBtnText: {
        color: colors.accent,
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
});

export default AddressBookScreen;
