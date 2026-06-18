import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../app/theme';

const { width: SW } = Dimensions.get('window');

const Toast = () => {
    const toast = useAppStore((s) => s.toast);
    const hideToast = useAppStore((s) => s.hideToast);
    
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(-40)).current;

    useEffect(() => {
        if (toast) {
            Animated.parallel([
                Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(slide, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
            ]).start();
        } else {
            Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        }
    }, [toast]);

    if (!toast) return null;

    const bgColor = toast.type === 'error' ? '#fef2f2' : toast.type === 'info' ? '#f0f9ff' : '#f0fdf4';
    const borderColor = toast.type === 'error' ? '#fee2e2' : toast.type === 'info' ? '#e0f2fe' : '#dcfce7';
    const textColor = toast.type === 'error' ? '#b91c1c' : toast.type === 'info' ? '#0369a1' : '#15803d';
    const icon = toast.type === 'error' ? '✖' : toast.type === 'info' ? 'ℹ' : '✔';

    return (
        <Animated.View style={[
            styles.container, 
            { 
                opacity: fade, 
                transform: [{ translateY: slide }],
                backgroundColor: bgColor,
                borderColor: borderColor
            }
        ]}>
            <View style={[styles.iconBox, { backgroundColor: textColor }]}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={[styles.msg, { color: textColor }]}>{toast.message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        zIndex: 9999,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    iconBox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    icon: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    msg: { fontSize: 13, fontWeight: '700', flex: 1, letterSpacing: 0.2 },
});

export default Toast;
