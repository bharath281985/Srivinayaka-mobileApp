import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = async () => {
    try {
      await api.post('/api/users', { name, email, password });
      Alert.alert('Success', 'Account created. Please login.');
      navigation.navigate('Login');
    } catch (e) {
      Alert.alert('Registration failed', e.response?.data?.message || 'Try again');
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Register</Text>
      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={register}><Text style={styles.btnText}>Create Account</Text></TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#f5f1ea', padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 20 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  btn: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});

export default RegisterScreen;
