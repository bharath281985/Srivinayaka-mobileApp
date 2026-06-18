import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PlaceholderScreen = ({ title }) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.sub}>This module is wired into navigation and ready for feature-specific API integration.</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#f5f1ea' },
  title: { fontSize: 24, fontWeight: '800', color: '#1f1f1f' },
  sub: { marginTop: 10, color: '#6b7280', textAlign: 'center' },
});

export default PlaceholderScreen;
