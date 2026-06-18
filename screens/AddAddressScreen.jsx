import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, radius, typography } from '../app/theme';

const AddAddressScreen = ({ route, navigation }) => {
    const { addressToEdit } = route.params || {};
    const addAddress = useAppStore((s) => s.addAddress);
    const updateAddress = useAppStore((s) => s.updateAddress);
    const addresses = useAppStore((s) => s.addresses);
    const showToast = useAppStore((s) => s.showToast);
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isMobile = width < 600;

    const [form, setForm] = useState(addressToEdit || {
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        phone: '',
        addressType: 'Home',
        isDefault: false
    });

    const update = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

    const save = () => {
        const { address, city, state, postalCode, phone, addressType } = form;
        
        if (!address.trim() || !city.trim() || !state.trim() || !postalCode.trim() || !phone.trim()) {
            showToast('Please fill in all mandatory fields.', 'error');
            return;
        }

        // Phone validation (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.trim())) {
            showToast('Please enter a valid 10-digit mobile number.', 'error');
            return;
        }

        // Uniqueness check for Home/Office
        if (addressType === 'Home' || addressType === 'Office') {
            const duplicate = addresses.find(a => 
                a.addressType === addressType && 
                (!addressToEdit || a.id !== addressToEdit.id)
            );
            if (duplicate) {
                showToast(`You already have a "${addressType}" address saved.`, 'error');
                return;
            }
        }

        if (addressToEdit) {
            updateAddress(addressToEdit.id, form);
            showToast('Address updated successfully!');
            navigation.goBack();
        } else {
            addAddress(form);
            showToast('New address added successfully!');
            navigation.goBack();
        }
    };

    return (
        <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[typography.h2, { marginBottom: spacing.md }]}>{addressToEdit ? 'Edit Address' : 'Add New Address'}</Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Full Address *</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Street, locality, house no."
                        value={form.address}
                        onChangeText={(v) => update('address', v)}
                        multiline
                    />
                </View>

                <View style={[styles.rowGroup, isMobile ? styles.rowGroupMobile : styles.rowGroupDesktop]}>
                    <View style={[styles.field, isMobile ? styles.fullWidth : styles.halfWidth]}>
                        <Text style={styles.label}>City *</Text>
                        <TextInput style={styles.input} placeholder="City" value={form.city} onChangeText={(v) => update('city', v)} />
                    </View>
                    <View style={[styles.field, isMobile ? styles.fullWidth : styles.halfWidth]}>
                        <Text style={styles.label}>Postal Code *</Text>
                        <TextInput style={styles.input} placeholder="ZIP" keyboardType="number-pad" value={form.postalCode} onChangeText={(v) => update('postalCode', v)} />
                    </View>
                </View>
                <View style={[styles.field, { marginTop: 4 }]}>
                    <Text style={styles.label}>State *</Text>
                    <TextInput style={styles.input} placeholder="Enter your state" value={form.state} onChangeText={(v) => update('state', v)} />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Phone Number *</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="10-digit mobile" 
                        keyboardType="phone-pad" 
                        maxLength={10}
                        value={form.phone} 
                        onChangeText={(v) => update('phone', v.replace(/[^0-9]/g, ''))} 
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Address Type *</Text>
                    <View style={styles.typeRow}>
                        {['Home', 'Office', 'Other'].map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.typeBtn,
                                    form.addressType === t && styles.typeBtnActive
                                ]}
                                onPress={() => update('addressType', t)}
                            >
                                <Text style={[
                                    styles.typeBtnText,
                                    form.addressType === t && styles.typeBtnTextActive
                                ]}>
                                    {t === 'Home' ? '🏠 Home' : t === 'Office' ? '🏢 Office' : '📍 Other'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.defaultRow}>
                    <Text style={styles.label}>Make this my default address</Text>
                    <Switch value={form.isDefault} onValueChange={(v) => update('isDefault', v)} trackColor={{ true: colors.primary }} />
                </View>

                <TouchableOpacity style={[styles.saveBtn, { marginBottom: Math.max(insets.bottom, 20) }]} onPress={save}>
                    <Text style={styles.saveBtnText}>{addressToEdit ? 'Update Address' : 'Save Address'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.md },
    field: { marginBottom: 14 },
    rowGroup: { width: '100%', marginBottom: 0 },
    rowGroupDesktop: { flexDirection: 'row', gap: 10 },
    rowGroupMobile: { flexDirection: 'column' },
    halfWidth: { flex: 1 },
    fullWidth: { width: '100%' },
    label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.card, borderRadius: radius.md, padding: 12, fontSize: 14, borderWidth: 1, borderColor: colors.border },
    defaultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10, padding: 14, backgroundColor: colors.card, borderRadius: radius.md },
    saveBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: 'center', marginTop: 20 },
    saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    typeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    typeBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeBtnActive: {
        borderColor: colors.primary,
        backgroundColor: '#fffcfb',
        borderWidth: 1.5,
    },
    typeBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
    },
    typeBtnTextActive: {
        color: colors.primary,
    },
});

export default AddAddressScreen;
