import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../utils/api';

const AdminLoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Error', 'Missing admin credentials');

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/admin/login`, { email, password });
            await AsyncStorage.setItem('token', res.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
            navigation.replace('AdminDashboard');
        } catch (err) {
            Alert.alert('Auth Failed', err.response?.data?.error || 'Unauthorized access attempt');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>🛡️ Admin Operations</Text>
                <Text style={styles.subtitle}>Enterprise Security Layer</Text>

                <TextInput style={styles.input} placeholder="Admin Username/Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
                <TextInput style={styles.input} placeholder="Secret Password" value={password} onChangeText={setPassword} secureTextEntry />

                <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>AUTHENTICATE</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#64748B', textAlign: 'center' }}>Cancel & Exit</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
    card: { width: '85%', backgroundColor: '#fff', borderRadius: 25, padding: 35 },
    title: { fontSize: 24, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
    subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 30, letterSpacing: 1 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 15, borderRadius: 12, marginBottom: 15 },
    btnPrimary: { backgroundColor: '#0F172A', padding: 18, borderRadius: 12, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', letterSpacing: 2 }
});

export default AdminLoginScreen;
