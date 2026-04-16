import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, Modal
} from 'react-native';
import axios from 'axios';
import API_URL from '../utils/api';

const RegisterScreen = ({ navigation }) => {
    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '',
        platform: 'Zomato', platformId: '', city: 'Mumbai', averageWeeklyIncome: '4000'
    });
    const [loading, setLoading] = useState(false);
    const [showCityPicker, setShowCityPicker] = useState(false);
    const [showPlatformPicker, setShowPlatformPicker] = useState(false);

    const handleRegister = async () => {
        if (!form.email.trim() || !form.phone.trim() || !form.password.trim() || !form.name.trim()) {
            return Alert.alert('Error', 'Name, email, phone, and password are required');
        }

        setLoading(true);
        try {
            const emailValue = form.email.trim().toLowerCase();
            await axios.post(`${API_URL}/auth/register`, {
                ...form,
                name: form.name.trim(),
                email: emailValue,
                phone: form.phone.trim(),
                password: form.password.trim(),
                platformId: form.platformId.trim(),
                averageWeeklyIncome: Number(form.averageWeeklyIncome)
            });

            Alert.alert('Activation Code Sent 📩', 'Verify your account to proceed.');
            navigation.replace('VerifyOTP', { identifier: emailValue, isLogin: false });
        } catch (err) {
            Alert.alert('Registration Failed', err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
                <Text style={styles.title}>Join DeliveryShield</Text>
                <Text style={styles.subtitle}>Secure your gig earnings with AI coverage</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={form.name} onChangeText={t => setForm({ ...form, name: t })} placeholder="John Doe" />
                </View>

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput style={styles.input} value={form.email} onChangeText={t => setForm({ ...form, email: t })} placeholder="email@ext.com" autoCapitalize="none" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput style={styles.input} value={form.phone} onChangeText={t => setForm({ ...form, phone: t })} placeholder="10 Digits" keyboardType="phone-pad" />
                    </View>
                </View>

                <Text style={styles.label}>Password</Text>
                <TextInput style={styles.input} value={form.password} onChangeText={t => setForm({ ...form, password: t })} secureTextEntry placeholder="••••••••" />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Primary City</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowCityPicker(true)}>
                            <Text style={styles.pickerText}>{form.city} ▽</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Work Platform</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowPlatformPicker(true)}>
                            <Text style={styles.pickerText}>{form.platform} ▽</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.label}>Platform Rider ID</Text>
                <TextInput style={styles.input} value={form.platformId} onChangeText={t => setForm({ ...form, platformId: t })} placeholder="ZOM-9921" />

                <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>CREATE SECURE ACCOUNT</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }}>
                    <Text style={styles.linkText}>Already have an account? <Text style={{ color: '#1E3A8A' }}>Login</Text></Text>
                </TouchableOpacity>
            </View>

            {/* Custom Pickers */}
            <Modal visible={showCityPicker} transparent animationType="fade">
                <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowCityPicker(false)}>
                    <View style={styles.pickerMenu}>
                        {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune'].map(c => (
                            <TouchableOpacity key={c} style={styles.pickerItem} onPress={() => { setForm({ ...form, city: c }); setShowCityPicker(false); }}>
                                <Text style={styles.pickerItemText}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showPlatformPicker} transparent animationType="fade">
                <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowPlatformPicker(false)}>
                    <View style={styles.pickerMenu}>
                        {['Zomato', 'Swiggy', 'Blinkit', 'Zepto', 'Amazon', 'Uber'].map(p => (
                            <TouchableOpacity key={p} style={styles.pickerItem} onPress={() => { setForm({ ...form, platform: p }); setShowPlatformPicker(false); }}>
                                <Text style={styles.pickerItemText}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, backgroundColor: '#EFF6FF', padding: 20, justifyContent: 'center' },
    card: { backgroundColor: '#fff', padding: 30, borderRadius: 30, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    title: { fontSize: 26, fontWeight: '900', color: '#1E3A8A', textAlign: 'center' },
    subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 30 },
    label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 15 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 14, borderRadius: 12, fontSize: 14, color: '#1E293B' },
    row: { flexDirection: 'row' },
    pickerTrigger: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 14, borderRadius: 12 },
    pickerText: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
    btnPrimary: { backgroundColor: '#1E3A8A', paddingHorizontal: 20, paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, elevation: 5 },
    btnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
    linkText: { color: '#64748B', textAlign: 'center', fontWeight: '700', fontSize: 14 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    pickerMenu: { backgroundColor: '#fff', width: '80%', borderRadius: 25, padding: 15 },
    pickerItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    pickerItemText: { fontSize: 16, textAlign: 'center', fontWeight: '700', color: '#1E293B' }
});

export default RegisterScreen;
