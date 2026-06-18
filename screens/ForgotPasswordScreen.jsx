import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../app/theme';

const ForgotPasswordScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('');

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[typography.h1, { marginBottom: 8 }]}>Forgot Password?</Text>
                <Text style={styles.sub}>
                    Since we use phone-based OTP authentication, simply log in with your registered phone number to regain access.
                </Text>

                <TouchableOpacity
                    style={styles.otpBtn}
                    onPress={() => {
                        if (!phone.trim()) { Alert.alert('Required', 'Enter your phone number.'); return; }
                        navigation.navigate('Login');
                    }}
                >
                    <Text style={styles.otpBtnText}>Login with OTP →</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.md, paddingTop: 48 },
    sub: { color: colors.muted, lineHeight: 22, marginBottom: spacing.lg },
    otpBtn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center' },
    otpBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default ForgotPasswordScreen;
