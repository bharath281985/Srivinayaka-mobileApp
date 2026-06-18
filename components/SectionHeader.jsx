import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '../app/theme';

const SectionHeader = ({ title, onViewAll }) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {onViewAll && (
      <TouchableOpacity onPress={onViewAll}>
        <Text style={styles.viewAll}>View All →</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { ...typography.h3 },
  viewAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});

export default SectionHeader;
