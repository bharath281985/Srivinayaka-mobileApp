import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, radius, typography } from '../app/theme';

const RAPIDO_DEFAULT_CITY = 'Hyderabad';
const RAPIDO_SERVICE_CITIES = ['Hyderabad', 'Secunderabad'];

const isRapidoServiceCity = (city = '') => (
    RAPIDO_SERVICE_CITIES.some((serviceCity) => serviceCity.toLowerCase() === city.trim().toLowerCase())
);

const getRapidoCity = (city = '') => (
    isRapidoServiceCity(city) ? city : RAPIDO_DEFAULT_CITY
);

const AddAddressScreen = ({ route, navigation }) => {
    const { addressToEdit, deliveryByRapido = false } = route.params || {};
    const addAddress = useAppStore((s) => s.addAddress);
    const updateAddress = useAppStore((s) => s.updateAddress);
    const addresses = useAppStore((s) => s.addresses);
    const showToast = useAppStore((s) => s.showToast);
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isMobile = width < 600;

    const [detecting, setDetecting] = useState(false);
    const [cityOptionsOpen, setCityOptionsOpen] = useState(false);
    const [form, setForm] = useState(addressToEdit ? {
        ...addressToEdit,
        city: deliveryByRapido ? getRapidoCity(addressToEdit.city) : addressToEdit.city,
        state: deliveryByRapido ? 'Telangana' : addressToEdit.state,
    } : {
        address: '',
        city: deliveryByRapido ? RAPIDO_DEFAULT_CITY : '',
        state: deliveryByRapido ? 'Telangana' : '',
        postalCode: '',
        country: 'India',
        phone: '',
        addressType: 'Home',
        isDefault: false
    });

    const update = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

    const selectRapidoCity = (city) => {
        setForm((prev) => ({ ...prev, city, state: prev.state || 'Telangana' }));
        setCityOptionsOpen(false);
    };

    const detectLocation = async () => {
        setDetecting(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showToast('Permission to access location was denied.', 'error');
                setDetecting(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAKHbbax8rKjSNi0jO_yOPY5zhnm93whcg`);
            const data = await response.json();

            if (data.status === 'OK' && data.results.length > 0) {
                const components = data.results[0].address_components;
                let streetNumber = '';
                let route = '';
                let sublocality = '';
                let locality = '';
                let state = '';
                let postalCode = '';
                components.forEach(c => {
                    if (c.types.includes('street_number')) streetNumber = c.long_name;
                    if (c.types.includes('route')) route = c.long_name;
                    if (c.types.includes('sublocality') || c.types.includes('sublocality_level_1')) sublocality = c.long_name;
                    if (c.types.includes('locality')) locality = c.long_name;
                    if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                    if (c.types.includes('postal_code')) postalCode = c.long_name;
                });

                setForm(prev => ({
                    ...prev,
                    address: [streetNumber, route, sublocality].filter(Boolean).join(', ') || data.results[0].formatted_address,
                    city: deliveryByRapido ? getRapidoCity(locality) : locality,
                    state: state || 'Telangana',
                    postalCode: postalCode,
                }));
                showToast('Location auto-detected successfully!');
            } else {
                showToast('Could not resolve location. Please enter manually.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error detecting location.', 'error');
        } finally {
            setDetecting(false);
        }
    };

    const save = () => {
        const { address, city, state, postalCode, phone, addressType } = form;
        
        if (!address.trim() || !city.trim() || !state.trim() || !postalCode.trim() || !phone.trim()) {
            showToast('Please fill in all mandatory fields.', 'error');
            return;
        }

        if (deliveryByRapido && !isRapidoServiceCity(city)) {
            showToast('Rapido delivery is available only in Hyderabad and Secunderabad.', 'error');
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={[styles.label, { marginBottom: 0 }]}>Full Address *</Text>
                        <TouchableOpacity
                            style={styles.detectBtn}
                            onPress={detectLocation}
                            disabled={detecting}
                        >
                            <Text style={styles.detectBtnText}>{detecting ? 'Locating...' : '📍 Auto-Detect'}</Text>
                        </TouchableOpacity>
                    </View>
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
                        {deliveryByRapido ? (
                            <View>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setCityOptionsOpen((open) => !open)}
                                >
                                    <Text style={styles.dropdownText}>{getRapidoCity(form.city)}</Text>
                                    <Text style={styles.dropdownArrow}>{cityOptionsOpen ? '^' : 'v'}</Text>
                                </TouchableOpacity>
                                {cityOptionsOpen && (
                                    <View style={styles.dropdownMenu}>
                                        {RAPIDO_SERVICE_CITIES.map((city) => (
                                            <TouchableOpacity
                                                key={city}
                                                style={[
                                                    styles.dropdownOption,
                                                    getRapidoCity(form.city) === city && styles.dropdownOptionActive,
                                                ]}
                                                onPress={() => selectRapidoCity(city)}
                                            >
                                                <Text style={[
                                                    styles.dropdownOptionText,
                                                    getRapidoCity(form.city) === city && styles.dropdownOptionTextActive,
                                                ]}>
                                                    {city}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                                <Text style={styles.rapidoHint}>Rapido delivery is available only in Hyderabad and Secunderabad.</Text>
                            </View>
                        ) : (
                            <TextInput style={styles.input} placeholder="City" value={form.city} onChangeText={(v) => update('city', v)} />
                        )}
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
    dropdownButton: {
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownText: { fontSize: 14, color: colors.text, fontWeight: '700' },
    dropdownArrow: { fontSize: 12, color: colors.primary, fontWeight: '900' },
    dropdownMenu: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.card,
        overflow: 'hidden',
    },
    dropdownOption: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    dropdownOptionActive: { backgroundColor: '#fdf8f1' },
    dropdownOptionText: { fontSize: 14, color: colors.text, fontWeight: '700' },
    dropdownOptionTextActive: { color: colors.primary },
    rapidoHint: { marginTop: 6, fontSize: 10, color: colors.primary, fontWeight: '800', lineHeight: 14 },
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
    detectBtn: {
        backgroundColor: colors.primary + '15',
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: radius.sm || 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    detectBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.primary,
    },
});

export default AddAddressScreen;
