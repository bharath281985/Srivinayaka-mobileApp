import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { colors } from '../app/theme';

const { width } = Dimensions.get('window');

/**
 * AppUpdateModal
 *
 * Shows a full-screen overlay when a new app version is available.
 * - forceUpdate=true  → no dismiss button, user MUST update
 * - forceUpdate=false → shows "Maybe Later" button
 */
const AppUpdateModal = ({ visible, forceUpdate, updateMessage, onUpdate, onDismiss }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>🚀</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.subtitle}>
            {Platform.OS === 'android' ? 'Google Play Store' : 'App Store'}
          </Text>

          {/* Message */}
          <Text style={styles.message}>{updateMessage}</Text>

          {/* Force update badge */}
          {forceUpdate && (
            <View style={styles.forceBadge}>
              <Text style={styles.forceText}>⚠️ Update required to continue</Text>
            </View>
          )}

          {/* Buttons */}
          <TouchableOpacity style={styles.updateBtn} onPress={onUpdate} activeOpacity={0.85}>
            <Text style={styles.updateBtnText}>
              {Platform.OS === 'android' ? '▶ Open Play Store' : '▶ Open App Store'}
            </Text>
          </TouchableOpacity>

          {!forceUpdate && (
            <TouchableOpacity style={styles.laterBtn} onPress={onDismiss} activeOpacity={0.7}>
              <Text style={styles.laterText}>Maybe Later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    width: Math.min(width - 48, 360),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  iconEmoji: { fontSize: 36 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary || '#78350f',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  message: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  forceBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  forceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    textAlign: 'center',
  },
  updateBtn: {
    backgroundColor: colors.primary || '#78350f',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  updateBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  laterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  laterText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default AppUpdateModal;
