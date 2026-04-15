import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api';

const LoginScreen = ({ navigation }) => {
    const [phone, setPhone] = useState('1234567890');
    const [password, setPassword] = useState('password');

    const handleLogin = async () => {
        try {
            // For local testing on actual device, replace 10.0.2.2 with your WiFi IP
            const res = await axios.post(`${API_URL}/auth/login`, { phone, password });
            await AsyncStorage.setItem('token', res.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
            navigation.replace('Dashboard');
        } catch (err) {
            Alert.alert('Error', 'Invalid credentials or server not found. Ensure backend is running.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>DeliveryShield</Text>
            <View style={styles.card}>
                <Text style={styles.subtitle}>Login</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
                    <Text style={styles.btnText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 15 }}>
                    <Text style={styles.linkText}>Don't have an account? Register</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    title: { fontSize: 32, fontWeight: '800', color: '#1E3A8A', marginBottom: 20 },
    card: { width: '85%', backgroundColor: '#fff', padding: 25, borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
    subtitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#0F172A' },
    input: { borderWidth: 1, borderColor: '#CBD5E1', padding: 14, borderRadius: 8, marginBottom: 15, backgroundColor: '#F1F5F9' },
    btnPrimary: { backgroundColor: '#1E3A8A', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    linkText: { color: '#3B82F6', textAlign: 'center', fontWeight: '600' }
});

export default LoginScreen;
