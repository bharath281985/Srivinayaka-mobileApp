import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cachedGet } from '../services/api';
import { LoadingState } from '../components/States';
import { colors, spacing, radius, typography } from '../app/theme';

const ContactUsScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);
    const [supportEmail, setSupportEmail] = useState('support@sareestudio.com');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cachedGet('/api/app-management/mobile-settings', 60000)
            .then((data) => {
                if (data?.supportEmail) setSupportEmail(data.supportEmail);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const send = () => {
        if (!name.trim() || !message.trim()) {
            Alert.alert('Required', 'Please fill in your name and message.');
            return;
        }
        // Open email client with pre-filled content
        const subject = encodeURIComponent(`Support Request from ${name}`);
        const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
        Linking.openURL(`mailto:${supportEmail}?subject=${subject}&body=${body}`).catch(() => {
            Alert.alert('Error', 'Could not open mail app.');
        });
        setSent(true);
    };

    if (loading) return <LoadingState />;

    if (sent) {
        return (
            <View style={styles.successWrap}>
                <Text style={{ fontSize: 64 }}>✅</Text>
                <Text style={[typography.h2, { marginTop: 16, textAlign: 'center' }]}>Message Sent!</Text>
                <Text style={[styles.sub, { textAlign: 'center' }]}>We'll get back to you within 24 hours.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[typography.h2, { marginBottom: 4 }]}>Contact Us</Text>
                <Text style={[styles.sub, { marginBottom: spacing.lg }]}>Fill in the form and we'll reply soon.</Text>

                <Text style={styles.label}>Your Name *</Text>
                <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} placeholder="your@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <Text style={styles.label}>Message *</Text>
                <TextInput style={[styles.input, styles.textarea]} placeholder="How can we help you?" value={message} onChangeText={setMessage} multiline numberOfLines={5} textAlignVertical="top" />

                <TouchableOpacity style={styles.btn} onPress={send}>
                    <Text style={styles.btnText}>Send Message</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.md },
    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.bg },
    sub: { color: colors.muted },
    label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 4 },
    input: { backgroundColor: colors.card, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
    textarea: { height: 120 },
    btn: { backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: 6 },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default ContactUsScreen;
