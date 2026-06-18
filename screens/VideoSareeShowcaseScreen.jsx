import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../app/theme';

// Placeholder — video showcase requires external video URLs from admin
// Admin can add video URIs via home sections or product fields (not yet in backend)
const VideoSareeShowcaseScreen = () => (
    <View style={styles.wrap}>
        <Text style={{ fontSize: 64 }}>🎥</Text>
        <Text style={[typography.h2, { textAlign: 'center', marginTop: 16 }]}>Video Saree Showcase</Text>
        <Text style={styles.sub}>
            Video showcase requires admin-configured video links.{'\n'}
            This screen is ready for integration once{'\n'}video URLs are added to the backend.
        </Text>
    </View>
);

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
    sub: { color: colors.muted, textAlign: 'center', marginTop: 12, lineHeight: 22 },
});

export default VideoSareeShowcaseScreen;
