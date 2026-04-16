import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert,
    ScrollView, ActivityIndicator, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_URL from '../utils/api';

const { width } = Dimensions.get('window');

const BuyPolicyScreen = ({ navigation }) => {
    const [quote, setQuote] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const [quoteRes, userRes] = await Promise.all([
                axios.get(`${API_URL}/policy/quote`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setQuote(quoteRes.data);
            setUser(userRes.data);
        } catch (err) {
            console.log('Error fetching data', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (method) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/policy/buy`,
                { paymentMethod: method },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert('Success ✅', `Policy activated via ${method}! Your protection is now live.`);
            navigation.replace('Dashboard');
        } catch (err) {
            Alert.alert('Purchase Failed', err.response?.data?.error || 'Could not complete transaction');
        }
    };

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={{ marginTop: 10, color: '#64748B' }}>Calculating AI Risk Premium...</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Dynamic Protection Quote</Text>
                <Text style={styles.subtitle}>Based on your operational location and risk profile.</Text>
            </View>

            {quote ? (
                <View style={styles.quoteCard}>
                    <View style={styles.badgeRow}>
                        {quote.explanation?.map(item => (
                            <View key={item} style={styles.miniBadge}><Text style={styles.miniBadgeText}>{item}</Text></View>
                        ))}
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={styles.currency}>₹</Text>
                        <Text style={styles.price}>{quote.weeklyPremium}</Text>
                        <Text style={styles.period}>/ week</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.featureList}>
                        <Text style={styles.feature}>🚀 Fully Automated Zero-Touch Claims</Text>
                        <Text style={styles.feature}>📉 Up to ₹{quote.incomeCovered} coverage / week</Text>
                        <Text style={styles.feature}>☁️ Heavy Rain & Heat Wave protection</Text>
                        <Text style={styles.feature}>📡 Real-time Sat-Telemetry Verification</Text>
                    </View>

                    <View style={styles.riskBox}>
                        <Text style={styles.riskLabel}>AI RISK MULTIPLIER</Text>
                        <Text style={styles.riskVal}>{quote.riskFactor}x</Text>
                    </View>

                    <View style={styles.actionSection}>
                        <Text style={styles.walletInfo}>Wallet Balance: ₹{user?.walletBalance || 0}</Text>

                        <TouchableOpacity
                            style={[styles.btnAction, { backgroundColor: '#1E293B' }]}
                            onPress={() => handlePurchase('wallet')}
                        >
                            <Text style={styles.btnText}>PAY FROM WALLET</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btnAction, { backgroundColor: '#10B981', marginTop: 12 }]}
                            onPress={() => handlePurchase('razorpay')}
                        >
                            <Text style={styles.btnText}>RAZORPAY CHECKOUT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>Unable to generate quote. Please check your profile city.</Text>
                </View>
            )}

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>How it works?</Text>
                <Text style={styles.infoDesc}>
                    Our AI engine monitors local weather and environmental sensors near your location.
                    If a disruption exceeds the policy margin, funds are instantly credited to your DeliveryShield wallet.
                </Text>
            </View>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EFF6FF', padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { marginTop: 40, marginBottom: 30, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '900', color: '#1E3A8A' },
    subtitle: { fontSize: 13, color: '#64748B', marginTop: 5, textAlign: 'center' },

    quoteCard: { backgroundColor: '#fff', borderRadius: 30, padding: 30, elevation: 10, shadowColor: '#1E3A8A', shadowOpacity: 0.1, shadowRadius: 20 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 20 },
    miniBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    miniBadgeText: { color: '#1E40AF', fontSize: 9, fontWeight: '800' },

    priceContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 10 },
    currency: { fontSize: 24, fontWeight: '800', color: '#1E3A8A', marginTop: 8 },
    price: { fontSize: 60, fontWeight: '900', color: '#1E3A8A' },
    period: { fontSize: 16, color: '#64748B', marginLeft: 5, alignSelf: 'center' },

    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 25 },

    featureList: { gap: 12, marginBottom: 25 },
    feature: { fontSize: 13, fontWeight: '600', color: '#475569' },

    riskBox: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    riskLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
    riskVal: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginTop: 4 },

    actionSection: { marginTop: 30 },
    walletInfo: { textAlign: 'center', fontSize: 12, color: '#64748B', fontWeight: '700', marginBottom: 15 },
    btnAction: { padding: 18, borderRadius: 15, alignItems: 'center', elevation: 3 },
    btnText: { color: '#fff', fontWeight: '900', letterSpacing: 1 },

    infoCard: { marginTop: 30, padding: 20, backgroundColor: 'rgba(30, 58, 138, 0.05)', borderRadius: 20, borderStyle: 'dotted', borderWidth: 1, borderColor: '#BFDBFE' },
    infoTitle: { fontSize: 14, fontWeight: '800', color: '#1E3A8A', marginBottom: 8 },
    infoDesc: { fontSize: 12, color: '#1E40AF', lineHeight: 18 },

    errorBox: { padding: 20, backgroundColor: '#FEE2E2', borderRadius: 15 },
    errorText: { color: '#B91C1C', textAlign: 'center', fontWeight: 'bold' }
});

export default BuyPolicyScreen;
