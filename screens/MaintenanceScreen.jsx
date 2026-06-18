import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../app/theme';

const MaintenanceScreen = ({ message, supportPhone }) => {
    return (
        <SafeAreaView style={styles.wrap}>
            <View style={styles.center}>
                <Text style={styles.icon}>🛠️</Text>
                <Text style={typography.h1}>Under Maintenance</Text>
                <Text style={styles.sub}>
                    {message || 'We are currently performing scheduled maintenance to improve your experience. We will be back soon!'}
                </Text>

                {supportPhone && (
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => Linking.openURL(`tel:${supportPhone}`)}
                    >
                        <Text style={styles.btnText}>Contact Support</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
    center: { alignItems: 'center', padding: spacing.xl },
    icon: { fontSize: 80, marginBottom: spacing.lg },
    sub: {
        textAlign: 'center',
        color: colors.muted,
        fontSize: 15,
        lineHeight: 22,
        marginTop: spacing.md,
        marginBottom: spacing.xl
    },
    btn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
    },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default MaintenanceScreen;
