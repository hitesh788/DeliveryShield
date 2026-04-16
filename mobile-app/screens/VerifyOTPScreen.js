import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Animated, ActivityIndicator } from 'react-native';
import axios from 'axios';
import API_URL from '../utils/api';

const VerifyOTPScreen = ({ route, navigation }) => {
    // identifier can be either email or phone
    const { identifier, isLogin } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (loading || resending) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(fadeAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
                    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true })
                ])
            ).start();
        } else {
            fadeAnim.setValue(1);
        }
    }, [loading, resending]);

    const handleVerify = async () => {
        if (otp.length !== 6) return Alert.alert('Error', 'Please enter a 6-digit OTP');
        setLoading(true);
        try {
            // Determine if identifier is email or phone
            const payload = { otp };
            if (identifier.includes('@')) {
                payload.email = identifier.toLowerCase();
            } else {
                payload.phone = identifier;
            }

            const res = await axios.post(`${API_URL}/auth/verify-otp`, payload);
            Alert.alert('Identity Verified ✅', res.data.message);
            // Redirect to login after verification
            navigation.replace('Login');
        } catch (err) {
            Alert.alert('Verification Failed', err.response?.data?.error || 'Invalid OTP code');
        } finally {
            setLoading(true); // Keep loading state until navigation
            setTimeout(() => setLoading(false), 1000);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const payload = {};
            if (identifier.includes('@')) {
                payload.email = identifier.toLowerCase();
            } else {
                payload.phone = identifier;
            }

            await axios.post(`${API_URL}/auth/resend-otp`, payload);
            Alert.alert('Success', 'A new security code has been transmitted.');
        } catch (err) {
            Alert.alert('Error', 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.formCard}>
                <Text style={styles.title}>Secure Verification</Text>
                <Text style={styles.subtitle}>
                    Enter the 6-digit synchronization code sent to{'\n'}
                    <Text style={{ fontWeight: 'bold', color: '#1E3A8A' }}>{identifier}</Text>
                </Text>

                <TextInput
                    style={styles.otpInput}
                    placeholder="000000"
                    placeholderTextColor="#94A3B8"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                />

                <TouchableOpacity
                    style={[styles.btnPrimary, loading && { backgroundColor: '#64748B' }]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>VERIFY & SYNC</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleResend}
                    disabled={resending}
                >
                    {resending ? (
                        <Text style={[styles.linkText, { color: '#94A3B8' }]}>TRANSMITTING...</Text>
                    ) : (
                        <Text style={styles.linkText}>Resend Security Code</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.replace('Login')} style={{ marginTop: 25 }}>
                    <Text style={{ color: '#64748B', textAlign: 'center', fontWeight: 'bold' }}>Abort & Return</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EFF6FF', justifyContent: 'center', padding: 25 },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 35,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20
    },
    title: { fontSize: 28, fontWeight: '900', color: '#1E3A8A', marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 35, lineHeight: 22 },
    otpInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 15,
        padding: 20,
        textAlign: 'center',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 10,
        marginBottom: 30,
        color: '#1E3A8A'
    },
    btnPrimary: {
        backgroundColor: '#1E3A8A',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 5
    },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1.5 },
    resendBtn: { marginTop: 25, alignSelf: 'center' },
    linkText: { color: '#3B82F6', fontWeight: '800', fontSize: 14 }
});

export default VerifyOTPScreen;
