import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { cachedGet } from '../services/api';
import { colors, spacing } from '../app/theme';
import { LoadingState, ErrorState } from '../components/States';

const BoutiquePageScreen = ({ route }) => {
    const { slug } = route.params || {};
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await cachedGet(`/api/pages/${slug}`, 300000); // Cache for 5 mins
            setPage(data);
        } catch (e) {
            setError('This chapter of our heritage is currently unavailable.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [slug]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={load} />;
    if (!page) return null;

    // Injecting some CSS to match our boutique theme
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, serif;
                    padding: 20px;
                    background-color: ${colors.bg};
                    color: ${colors.text};
                    line-height: 1.6;
                    font-size: 16px;
                }
                h1, h2, h3 { color: ${colors.primary}; font-weight: 900; }
                p { margin-bottom: 20px; }
                strong { font-weight: 900; color: ${colors.primary}; }
                ul { padding-left: 20px; }
                li { margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <h1 style="margin-bottom: 5px; font-size: 28px;">${page.title}</h1>
            <div style="width: 40px; height: 4px; background-color: ${colors.accent}; border-radius: 2px; margin-bottom: 30px;"></div>
            ${page.content}
        </body>
        </html>
    `;

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <WebView
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.webview}
                showsVerticalScrollIndicator={false}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loader}>
                        <ActivityIndicator color={colors.primary} size="large" />
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    webview: { flex: 1, backgroundColor: 'transparent' },
    loader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg
    }
});

export default BoutiquePageScreen;
