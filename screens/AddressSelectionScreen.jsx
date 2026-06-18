import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography } from '../app/theme';

const AddressSelectionScreen = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.wrap}>
            <Text style={[typography.h2, { marginBottom: 10 }]}>Select Address</Text>
            <Text style={{ color: colors.muted }}>Address selection is handled directly in checkout.</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('AddAddress')}>
                <Text style={styles.btnText}>+ Add New Address</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg, padding: 16, justifyContent: 'center', alignItems: 'center' },
    btn: { marginTop: 20, backgroundColor: colors.primary, borderRadius: 10, padding: 14 },
    btnText: { color: '#fff', fontWeight: '700' },
});

export default AddressSelectionScreen;
