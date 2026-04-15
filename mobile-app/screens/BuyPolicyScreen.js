import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:5000/api';

const BuyPolicyScreen = ({ navigation }) => {
    const [quote, setQuote] = useState(null);

    useEffect(() => {
        fetchQuote();
    }, []);

    const fetchQuote = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/policy/quote`, { headers: { Authorization: `Bearer ${token}` } });
            setQuote(res.data);
        } catch (err) {
            console.log('Error fetching quote', err);
        }
    };

    const handlePurchase = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/policy/buy`, {}, { headers: { Authorization: `Bearer ${token}` } });
            Alert.alert('Success', 'Policy purchased! Payment simulated.');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Purchase failed');
        }
    };

    return (
        <View style={styles.container}>
            {quote ? (
                <View style={styles.card}>
                    <Text style={styles.title}>AI Income Protection</Text>
                    <Text style={styles.price}>₹{quote.weeklyPremium} <Text style={styles.subText}>/ week</Text></Text>

                    <View style={styles.detailsBox}>
                        <Text style={styles.detailText}>✅ Over up to ₹{quote.incomeCovered} equivalent</Text>
                        <Text style={styles.detailText}>✅ Weather & Environment disruptions</Text>
                        <Text style={styles.detailText}>✅ Automated payouts without manual claims</Text>
                        <Text style={[styles.detailText, { fontSize: 12, color: 'gray', marginTop: 10 }]}>AI Risk Multipiler: {quote.riskFactor}x</Text>
                    </View>

                    <TouchableOpacity style={styles.btnSuccess} onPress={handlePurchase}>
                        <Text style={styles.btnText}>Pay with Razorpay (Mock)</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text>Loading AI Quote...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6', justifyContent: 'center' },
    card: { backgroundColor: '#4F46E5', borderRadius: 16, padding: 30, alignItems: 'center', elevation: 5 },
    title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    price: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
    subText: { fontSize: 16, fontWeight: 'normal' },
    detailsBox: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 8, marginTop: 20, width: '100%', marginBottom: 20 },
    detailText: { color: '#fff', marginBottom: 5 },
    btnSuccess: { backgroundColor: '#10B981', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});

export default BuyPolicyScreen;
