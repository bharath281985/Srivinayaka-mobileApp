import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../app/theme';

// Order summary is shown within the Checkout screen inline.
// This screen is kept in navigation register but redirects.
const OrderSummaryScreen = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.wrap}>
            <Text style={typography.h2}>Order Summary</Text>
            <Text style={{ color: colors.muted, marginTop: 8, textAlign: 'center' }}>
                Your full order summary is shown during checkout.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Checkout')}>
                <Text style={styles.btnText}>Go to Checkout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 20 },
    btn: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 10, padding: 14 },
    btnText: { color: '#fff', fontWeight: '700' },
});

export default OrderSummaryScreen;
