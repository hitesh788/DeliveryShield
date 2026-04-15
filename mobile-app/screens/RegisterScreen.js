import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api';

const RegisterScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: 'Ravi Kumar', phone: '1234567890', password: 'password', platform: 'Swiggy', city: 'Mumbai', averageWeeklyIncome: '4500'
    });

    const handleRegister = async () => {
        try {
            await axios.post(`${API_URL}/auth/register`, { ...formData, averageWeeklyIncome: Number(formData.averageWeeklyIncome) });
            Alert.alert('Success', 'Registration complete. Please login.');
            navigation.navigate('Login');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Register</Text>
            <View style={styles.card}>
                <TextInput style={styles.input} placeholder="Name" value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} />
                <TextInput style={styles.input} placeholder="Phone" value={formData.phone} keyboardType="phone-pad" onChangeText={t => setFormData({ ...formData, phone: t })} />
                <TextInput style={styles.input} placeholder="Password" value={formData.password} secureTextEntry onChangeText={t => setFormData({ ...formData, password: t })} />
                <TextInput style={styles.input} placeholder="City (Mumbai/Delhi)" value={formData.city} onChangeText={t => setFormData({ ...formData, city: t })} />
                <TextInput style={styles.input} placeholder="Platform (Zomato/Swiggy)" value={formData.platform} onChangeText={t => setFormData({ ...formData, platform: t })} />
                <TextInput style={styles.input} placeholder="Avg Weekly Income" value={formData.averageWeeklyIncome} keyboardType="numeric" onChangeText={t => setFormData({ ...formData, averageWeeklyIncome: t })} />

                <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister}>
                    <Text style={styles.btnText}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 15 }}>
                    <Text style={styles.linkText}>Already have an account? Login</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 40 },
    title: { fontSize: 32, fontWeight: '800', color: '#1E3A8A', marginBottom: 20 },
    card: { width: '85%', backgroundColor: '#fff', padding: 25, borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
    input: { borderWidth: 1, borderColor: '#CBD5E1', padding: 14, borderRadius: 8, marginBottom: 15, backgroundColor: '#F1F5F9' },
    btnPrimary: { backgroundColor: '#1E3A8A', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    linkText: { color: '#3B82F6', textAlign: 'center', fontWeight: '600' }
});

export default RegisterScreen;
