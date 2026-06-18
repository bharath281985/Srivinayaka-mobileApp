import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import api, { getImageUrl } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, radius, typography } from '../app/theme';
import { Image } from 'expo-image';

const EditProfileScreen = ({ navigation }) => {
    const user = useAuthStore((s) => s.user);
    const login = useAuthStore((s) => s.login);
    const token = useAuthStore((s) => s.token);
    const showToast = useAppStore((s) => s.showToast);

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [age, setAge] = useState(user?.age ? String(user.age) : '');
    const [gender, setGender] = useState(user?.gender || 'Prefer not to say');
    const [profileImage, setProfileImage] = useState(user?.profileImage || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Fetch latest profile on mount
    useEffect(() => {
        api.get('/api/users/profile')
            .then(({ data }) => {
                setName(data.name || '');
                setEmail(data.email || '');
                setAge(data.age ? String(data.age) : '');
                setGender(data.gender || 'Prefer not to say');
                setProfileImage(data.profileImage || '');
            })
            .catch(() => { });
    }, []);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri) => {
        setUploading(true);
        const fileName = uri.split('/').pop();
        const fileType = fileName.split('.').pop();
        
        const formData = new FormData();
        formData.append('image', {
            uri,
            name: fileName,
            type: `image/${fileType}`,
        });

        try {
            const { data } = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfileImage(data);
            showToast('Image uploaded! Save profile to finalize.');
        } catch (e) {
            showToast('Failed to upload image.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        if (!name.trim()) { showToast('Name cannot be empty.', 'error'); return; }
        setLoading(true);
        try {
            const payload = { 
                name, 
                email, 
                age: age ? Number(age) : null, 
                gender, 
                profileImage 
            };
            const { data } = await api.put('/api/users/profile', payload);
            await login({ token, user: data });
            showToast('Profile updated successfully!');
            navigation.goBack();
        } catch (e) {
            showToast(e.response?.data?.message || 'Could not update profile.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.wrap} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[typography.h2, { marginBottom: spacing.md }]}>Update Profile</Text>

                <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} disabled={uploading}>
                    <View style={styles.avatarInner}>
                        {uploading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : profileImage ? (
                            <Image source={{ uri: getImageUrl(profileImage) }} style={styles.avatarImg} />
                        ) : (
                            <Text style={{ fontSize: 40 }}>👤</Text>
                        )}
                    </View>
                    <View style={styles.editBadge}>
                        <Text style={styles.editBadgeText}>EDIT</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.field}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />
                </View>
                <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.label}>Age</Text>
                        <TextInput
                            style={styles.input}
                            value={age}
                            onChangeText={setAge}
                            placeholder="Ex: 25"
                            keyboardType="number-pad"
                            maxLength={3}
                        />
                    </View>
                    <View style={[styles.field, { flex: 2 }]}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.genderRow}>
                            {['Male', 'Female', 'Other'].map(g => (
                                <TouchableOpacity 
                                    key={g} 
                                    style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                                    onPress={() => setGender(g)}
                                >
                                    <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={[styles.field, { backgroundColor: '#f8f9fc', borderRadius: 20, padding: 20, marginTop: 10, borderWidth: 1, borderColor: '#eee' }]}>
                    <Text style={[styles.label, { color: '#94a3b8' }]}>Phone Number</Text>
                    <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: '700', marginTop: 4 }}>{user?.phone || '—'}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>(Phone number is verified and cannot be changed)</Text>
                </View>

                <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={save} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>UPDATE</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.md, alignItems: 'stretch' },
    avatarWrap: { alignSelf: 'center', marginVertical: 24, position: 'relative' },
    avatarInner: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarImg: { width: '100%', height: '100%' },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
    editBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    field: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
    input: {
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 12,
        fontSize: 14,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
    },
    btn: {
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 40,
    },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1, textTransform: 'uppercase' },
    genderRow: { flexDirection: 'row', gap: 6, backgroundColor: '#f1f1f1', padding: 4, borderRadius: 12 },
    genderBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    genderBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    genderText: { fontSize: 12, fontWeight: '700', color: '#666' },
    genderTextActive: { color: colors.primary },
});

export default EditProfileScreen;
