import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../utils/api';

const LoginScreen = ({ navigation }) => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        const identifier = loginId.trim();
        const secret = password.trim();

        if (!identifier || !secret) {
            return Alert.alert('Credentials Required', 'Please enter your identity and secret');
        }

        const payload = { password: secret };
        if (identifier.includes('@')) {
            payload.email = identifier.toLowerCase();
        } else {
            payload.phone = identifier;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/login`, payload);

            if (res.data.user.role === 'admin') {
                Alert.alert('Access Denied', 'Please use the Admin Portal for administrative access.');
                setLoading(false);
                return;
            }

            await AsyncStorage.setItem('token', res.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));

            // Sync current plan if available
            if (res.data.user.currentPlan) {
                await AsyncStorage.setItem('userPlan', res.data.user.currentPlan);
            }

            navigation.replace('Dashboard');
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.unverified) {
                Alert.alert('Verification Required', 'Your account is pending synchronization.');
                navigation.navigate('VerifyOTP', { identifier, isLogin: true });
            } else {
                Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials or network interruption');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const identifier = loginId.trim();
        if (!identifier || !identifier.includes('@')) {
            return Alert.alert('Forgot Password', 'Please enter your registered email address in the Email field above, then tap "Forgot Password?" again.');
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/forgot-password`, { email: identifier });
            Alert.alert('Password Recovery', res.data.message || 'A temporary password has been sent to your email.');
        } catch (err) {
            Alert.alert('Recovery Failed', err.response?.data?.error || 'Unable to reset password. Please check if your email is correct.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Text style={styles.logoText}>🛡️ DeliveryShield</Text>
                <Text style={styles.tagline}>Smart Parametric Insurance Hub</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.title}>Secure Login</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Email Address or Phone"
                    value={loginId}
                    onChangeText={setLoginId}
                    autoCapitalize="none"
                    keyboardType="default"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Secure Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: 'flex-end', marginBottom: 20, marginTop: -5 }}>
                    <Text style={{ color: '#3B82F6', fontWeight: '700', fontSize: 13 }}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>ENTER DASHBOARD</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 25 }}>
                    <Text style={styles.linkText}>New rider? <Text style={{ color: '#3B82F6' }}>Create secure profile</Text></Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.adminLink}
                onPress={() => navigation.navigate('AdminLogin')}
            >
                <Text style={styles.adminText}>⚙️ Enterprise Admin Portal</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' },
    logoContainer: { alignItems: 'center', marginBottom: 50 },
    logoText: { fontSize: 36, fontWeight: '900', color: '#1E3A8A' },
    tagline: { fontSize: 13, color: '#64748B', marginTop: 8, letterSpacing: 1, fontWeight: '600' },
    card: { width: '85%', backgroundColor: '#fff', padding: 35, borderRadius: 30, elevation: 15, shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    title: { fontSize: 22, fontWeight: '900', marginBottom: 30, color: '#0F172A', textAlign: 'center' },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 16, borderRadius: 15, marginBottom: 18, fontSize: 15, color: '#1E293B' },
    btnPrimary: { backgroundColor: '#1E3A8A', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 5 },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1.5 },
    linkText: { color: '#64748B', textAlign: 'center', fontWeight: '700', fontSize: 14 },
    adminLink: { position: 'absolute', bottom: 50 },
    adminText: { color: '#94A3B8', fontSize: 13, fontWeight: 'bold', textDecorationLine: 'underline' }
});

export default LoginScreen;
