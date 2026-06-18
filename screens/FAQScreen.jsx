import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cachedGet } from '../services/api';
import { colors, spacing, radius, typography } from '../app/theme';
import { LoadingState, ErrorState, EmptyState } from '../components/States';

const FAQScreen = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await cachedGet('/api/faqs', 60000);
            setFaqs(Array.isArray(data) ? data : []);
        } catch {
            setError('Unable to load FAQs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={load} />;
    if (!faqs.length) return <EmptyState icon="❓" title="No FAQs available" subtitle="Check back later." />;

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[typography.h2, { marginBottom: spacing.md }]}>Frequently Asked Questions</Text>
                {faqs.map((faq, i) => (
                    <TouchableOpacity
                        key={faq._id || i}
                        style={styles.item}
                        onPress={() => setExpanded(expanded === i ? null : i)}
                        activeOpacity={0.85}
                    >
                        <View style={styles.questionRow}>
                            <Text style={styles.question}>{faq.question}</Text>
                            <Text style={styles.chevron}>{expanded === i ? '▲' : '▼'}</Text>
                        </View>
                        {expanded === i && <Text style={styles.answer}>{faq.answer}</Text>}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.md },
    item: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: 8,
    },
    questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    question: { flex: 1, fontWeight: '700', fontSize: 14, color: colors.text, lineHeight: 20 },
    chevron: { color: colors.primary, fontWeight: '700', fontSize: 12 },
    answer: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border },
});

export default FAQScreen;
