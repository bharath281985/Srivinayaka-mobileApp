import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { colors, spacing, radius, typography } from '../app/theme';

const CompleteProfileScreen = ({ route, navigation }) => {
    const { authData } = route.params;
    const login = useAuthStore((s) => s.login);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [loading, setLoading] = useState(false);

    const completeProfile = async () => {
        if (!name.trim()) { Alert.alert('Required', 'Name cannot be empty.'); return; }
        if (!email.trim()) { Alert.alert('Required', 'Email cannot be empty.'); return; }

        setLoading(true);
        try {
            // Update profile on backend
            const { data } = await api.put(
                '/api/users/profile',
                { name, email, age: Number(age) || undefined },
                { headers: { Authorization: `Bearer ${authData.token}` } }
            );

            // Log in using updated data
            await login({ token: authData.token, user: data });
            const { useAuthStore } = await import('../store/useAuthStore');
            const { postLoginRedirect, clearPostLoginRedirect } = useAuthStore.getState();
            const target = postLoginRedirect;
            clearPostLoginRedirect();
            if (target?.routeName) {
                navigation.getParent()?.navigate(target.routeName, target.params);
            } else {
                navigation.getParent()?.navigate('Main');
            }
        } catch (e) {
            Alert.alert('Update Failed', e.response?.data?.message || 'Could not complete profile. Please try again.');
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[typography.h2, { marginBottom: spacing.xs, color: colors.primary }]}>Complete Profile</Text>
                <Text style={[typography.body, { marginBottom: spacing.xl, color: colors.muted }]}>
                    Please provide your basic details to complete your account setup.
                </Text>

                <View style={styles.field}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />
                </View>
                
                <View style={styles.field}>
                    <Text style={styles.label}>Email Details *</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.field}>
                    <Text style={styles.label}>Age (optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={age}
                        onChangeText={setAge}
                        placeholder="25"
                        keyboardType="number-pad"
                    />
                </View>

                <TouchableOpacity style={[styles.btn, (loading || !name || !email) && { opacity: 0.7 }]} onPress={completeProfile} disabled={loading || !name || !email}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Complete Sign In</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.xl, alignItems: 'stretch' },
    field: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '700', color: colors.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        backgroundColor: '#f9fafb',
        borderRadius: radius.md,
        padding: 16,
        fontSize: 15,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    btn: {
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    btnText: { color: colors.accent, fontWeight: '800', fontSize: 16 },
});

export default CompleteProfileScreen;
