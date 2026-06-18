import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '../app/theme';

export const EmptyState = ({ icon = '🛍️', title, subtitle, actionText, onAction }) => (
  <View style={styles.wrap}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    {actionText ? (
      <TouchableOpacity style={styles.btn} onPress={onAction}>
        <Text style={styles.btnText}>{actionText}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

export const ErrorState = ({ message, onRetry }) => (
  <View style={styles.wrap}>
    <Text style={styles.icon}>⚠️</Text>
    <Text style={styles.title}>Something went wrong</Text>
    <Text style={styles.sub}>{message || 'Unable to fetch data. Check your connection.'}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.btn} onPress={onRetry}>
        <Text style={styles.btnText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const LoadingState = () => (
  <View style={styles.wrap}>
    <Text style={{ color: colors.muted, marginTop: 20 }}>Loading…</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { fontSize: 52, marginBottom: 14 },
  title: { ...typography.h3, textAlign: 'center' },
  sub: { marginTop: 8, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
