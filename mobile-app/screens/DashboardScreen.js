import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api';

const DashboardScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [policy, setPolicy] = useState(null);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [digitalHealth, setDigitalHealth] = useState({ label: 'Excellent', color: '#10B981', icon: '💚' });
    const [planLabel, setPlanLabel] = useState('PRO');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            // Fetch live user data (matches the /me route on the web)
            const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            setUser(res.data);
            await AsyncStorage.setItem('user', JSON.stringify(res.data));
            fetchPolicy(token);

            // Fetch Digital Health API
            try {
                const clRes = await axios.get(`${API_URL}/claim`, { headers: { Authorization: `Bearer ${token}` } });
                const rejectedCount = clRes.data.filter(c => c.isFraudulent).length;
                if (rejectedCount === 0) setDigitalHealth({ label: 'Excellent', color: '#10B981', icon: '💚' });
                else if (rejectedCount <= 1) setDigitalHealth({ label: 'Average', color: '#F59E0B', icon: '💛' });
                else setDigitalHealth({ label: 'Poor', color: '#EF4444', icon: '❤️' });
            } catch (e) { }

            const storedPlan = await AsyncStorage.getItem('userPlan');
            if (storedPlan === 'BETA PLAN') setPlanLabel('BETA');
            else if (storedPlan === 'ELITE CORP') setPlanLabel('ELITE');
            else setPlanLabel('PRO');
        } catch (err) {
            console.log('Error syncing user', err);
        }
    };

    const fetchPolicy = async (token) => {
        try {
            const res = await axios.get(`${API_URL}/policy/active`, { headers: { Authorization: `Bearer ${token}` } });
            setPolicy(res.data);
        } catch (err) {
            console.log('No active policy');
            setPolicy(null);
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.clear();
        navigation.replace('Login');
    };

    const triggerDisruption = async (type) => {
        setLoadingMsg(`Acquiring GPS & analyzing weather for ${type}...`);
        try {
            const token = await AsyncStorage.getItem('token');

            // GPS resolution via openweather mock defaults if native location is blocked
            const lat = 13.0827;
            const lon = 80.2707;

            const res = await axios.post(`${API_URL}/claim/auto-trigger`, { disruptionType: type, lat, lon }, { headers: { Authorization: `Bearer ${token}` } });
            Alert.alert('✅ Claim Processed', res.data.message);
            setLoadingMsg('');
            loadData(); // refresh wallet
        } catch (err) {
            setLoadingMsg('');
            Alert.alert('🚨 Fraud Check Failed', err.response?.data?.message || err.message);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Modal visible={showMenu} animationType="slide" transparent={true}>
                <View style={styles.menuOverlay}>
                    <View style={styles.menuContainer}>
                        <TouchableOpacity onPress={() => setShowMenu(false)} style={styles.closeBtn}>
                            <Text style={{ fontWeight: 'bold', fontSize: 24 }}>X</Text>
                        </TouchableOpacity>

                        <Text style={styles.menuTitle}>DeliveryShield {planLabel}</Text>
                        <Text style={{ textAlign: 'center', color: digitalHealth.color, fontWeight: 'bold', marginBottom: 20 }}>
                            {digitalHealth.icon} Digital Health: {digitalHealth.label}
                        </Text>

                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); }}>
                            <Text style={styles.menuText}>🏠 Dashboard</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate('Claims'); }}>
                            <Text style={styles.menuText}>🛡️ Auto-Claims History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, { marginTop: 'auto', borderTopWidth: 1, borderColor: '#E2E8F0' }]} onPress={handleLogout}>
                            <Text style={[styles.menuText, { color: '#EF4444' }]}>🚪 Logout Route</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.header}>
                <View>
                    <Text style={{ fontWeight: 'bold', color: '#1E3A8A' }}>DeliveryShield {planLabel}</Text>
                    <Text style={styles.greeting}>Hi, {user?.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.burgerBtn}>
                    <Text style={{ fontWeight: 'bold', fontSize: 32 }}>☰</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.metricTitle}>Wallet Payouts</Text>
                    <Text style={styles.metricValue}>₹{user?.walletBalance || 0}</Text>
                </View>
                <View style={[styles.metricCard, { backgroundColor: '#1E3A8A' }]}>
                    <Text style={styles.metricTitle}>Active Cover</Text>
                    <Text style={styles.metricValue}>₹{policy ? policy.incomeCovered : 0}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Current Policy Status</Text>
                {policy ? (
                    <View>
                        <Text style={styles.textGreen}>🛡️ ACTIVE</Text>
                        <Text style={{ color: '#64748B' }}>Expires: {new Date(policy.endDate).toLocaleDateString()}</Text>
                    </View>
                ) : (
                    <View>
                        <Text style={styles.errorText}>No Active Policy Found</Text>
                        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('BuyPolicy')}>
                            <Text style={styles.btnText}>Buy Recommended Policy</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={[styles.card, { marginTop: 20 }]}>
                <Text style={styles.cardTitle}>Auto-Claim Simulator</Text>
                <Text style={{ color: '#64748B', marginBottom: 15 }}>Trigger satellite validation payload.</Text>

                {loadingMsg !== '' && (
                    <View style={{ padding: 10, backgroundColor: '#F1F5F9', borderRadius: 8, marginBottom: 15, alignItems: 'center' }}>
                        <ActivityIndicator color="#1E3A8A" />
                        <Text style={{ color: '#1E3A8A', marginTop: 5, fontSize: 12 }}>{loadingMsg}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.btnWarning} onPress={() => triggerDisruption('Heavy Rain')} disabled={loadingMsg !== ''}>
                    <Text style={[styles.btnText, { color: '#92400E' }]}>🌧️ Heavy Rain Alert</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDanger} onPress={() => triggerDisruption('Extreme Heat')} disabled={loadingMsg !== ''}>
                    <Text style={styles.btnText}>🌡️ Extreme Heat Notice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDark} onPress={() => triggerDisruption('Pollution')} disabled={loadingMsg !== ''}>
                    <Text style={styles.btnText}>🌫️ High AQI Detected</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.btnOutline, { marginTop: 20, marginBottom: 40 }]} onPress={() => navigation.navigate('Claims')}>
                <Text style={[styles.btnText, { color: '#1E3A8A' }]}>View Auto-Claims History</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, alignItems: 'center' },
    greeting: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
    burgerBtn: { padding: 5 },
    menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    menuContainer: { backgroundColor: '#fff', height: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25 },
    closeBtn: { alignSelf: 'flex-end', padding: 10 },
    menuTitle: { fontSize: 24, fontWeight: '800', color: '#1E3A8A', marginBottom: 20, textAlign: 'center' },
    menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F1F5F9' },
    menuText: { fontSize: 18, color: '#0F172A', fontWeight: 'bold' },
    metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    metricCard: { flex: 0.48, padding: 20, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
    metricTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' },
    metricValue: { color: 'white', fontSize: 24, fontWeight: '900', marginTop: 5 },
    card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 3, borderWidth: 1, borderColor: '#E2E8F0' },
    cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10, color: '#0F172A' },
    textGreen: { color: '#10B981', fontWeight: '800', fontSize: 18, marginBottom: 5 },
    errorText: { color: '#EF4444', marginBottom: 15, fontWeight: 'bold' },
    btnPrimary: { backgroundColor: '#1E3A8A', padding: 14, borderRadius: 8, alignItems: 'center' },
    btnWarning: { backgroundColor: '#FDE68A', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    btnDanger: { backgroundColor: '#EF4444', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    btnDark: { backgroundColor: '#1E293B', padding: 14, borderRadius: 8, alignItems: 'center' },
    btnOutline: { backgroundColor: 'transparent', padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: '#1E3A8A' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});

export default DashboardScreen;
