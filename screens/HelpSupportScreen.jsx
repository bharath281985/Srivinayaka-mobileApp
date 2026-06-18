import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cachedGet } from '../services/api';
import { colors, spacing, radius, typography } from '../app/theme';
import { LoadingState } from '../components/States';

const SupportItem = ({ icon, label, value, onPress }) => (
    <TouchableOpacity style={styles.supportRow} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.supportIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
            <Text style={styles.supportLabel}>{label}</Text>
            <Text style={styles.supportValue}>{value}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
);

const HelpSupportScreen = ({ navigation }) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Try fetching public mobile settings for contact info
        cachedGet('/api/app-management/mobile-settings', 60000)
            .then(setSettings)
            .catch(() => setSettings({}))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingState />;

    const phone = settings?.supportPhone || '';
    const email = settings?.supportEmail || '';
    const   whatsapp = settings?.whatsappSupport || '';

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[typography.h2, { marginBottom: 4 }]}>Help & Support</Text>
                <Text style={[typography.caption, { marginBottom: spacing.lg }]}>We're here to help. Reach us anytime.</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    {phone ? (
                        <SupportItem icon="📞" label="Call Us" value={phone} onPress={() => Linking.openURL(`tel:${phone}`)} />
                    ) : null}
                    {email ? (
                        <SupportItem icon="✉️" label="Email Us" value={email} onPress={() => Linking.openURL(`mailto:${email}`)} />
                    ) : null}
                    {whatsapp ? (
                        <SupportItem icon="💬" label="WhatsApp Support" value={whatsapp} onPress={() => Linking.openURL(`https://wa.me/${whatsapp.replace(/\D/g, '')}`)} />
                    ) : null}
                    {!phone && !email && !whatsapp && (
                        <Text style={{ color: colors.muted, fontStyle: 'italic' }}>Contact info not configured by admin yet.</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Links</Text>
                    <SupportItem icon="❓" label="FAQs" value="Frequent questions answered" onPress={() => navigation.navigate('FAQ')} />
                    <SupportItem icon="✉️" label="Contact Us Form" value="Send us a message" onPress={() => navigation.navigate('ContactUs')} />
                    <SupportItem icon="🚚" label="Shipping Policy" value="Read about delivery times" onPress={() => navigation.navigate('BoutiquePage', { slug: 'shipping-policy' })} />
                    <SupportItem icon="🔄" label="Returns Policy" value="Our seamless return process" onPress={() => navigation.navigate('BoutiquePage', { slug: 'returns-policy' })} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.md },
    section: { marginBottom: spacing.lg },
    sectionTitle: { fontWeight: '700', fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
    supportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 14,
        marginBottom: 8,
        gap: 14,
    },
    supportIcon: { fontSize: 22 },
    supportLabel: { fontWeight: '700', color: colors.text, fontSize: 14 },
    supportValue: { color: colors.muted, fontSize: 13, marginTop: 2 },
    arrow: { color: colors.muted, fontSize: 18 },
    policyText: { color: colors.muted, lineHeight: 22 },
});

export default HelpSupportScreen;
