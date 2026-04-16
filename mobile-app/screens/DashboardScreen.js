import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, Platform,
    ScrollView, ActivityIndicator, Modal, TextInput, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import API_URL from '../utils/api';

const PLAN_PRICES = {
    'BETA PLAN': 45,
    'PRO LEVEL': 95,
    'ELITE CORP': 150
};

const DashboardScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [policy, setPolicy] = useState(null);
    const [quote, setQuote] = useState(null);
    const [stats, setStats] = useState({ totalClaims: 0, approvedClaims: 0, totalPayout: 0 });

    // UI States
    const [loadingMsg, setLoadingMsg] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Input States
    const [upiId, setUpiId] = useState('');
    const [payoutAmount, setPayoutAmount] = useState('');
    const [topUpAmount, setTopUpAmount] = useState('');

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return navigation.replace('Login');

            const headers = { Authorization: `Bearer ${token}` };

            // Parallel Data Fetching
            const [userRes, policyRes, quoteRes, claimsRes] = await Promise.all([
                axios.get(`${API_URL}/auth/me`, { headers }),
                axios.get(`${API_URL}/policy/active`, { headers }).catch(() => ({ data: null })),
                axios.get(`${API_URL}/policy/quote`, { headers }).catch(() => ({ data: null })),
                axios.get(`${API_URL}/claim`, { headers }).catch(() => ({ data: [] }))
            ]);

            setUser(userRes.data);
            setPolicy(policyRes.data);
            setQuote(quoteRes.data);

            // Calculate Stats
            const claims = claimsRes.data || [];
            const approved = claims.filter(c => c.status === 'approved' || c.status === 'auto-approved');
            setStats({
                totalClaims: claims.length,
                approvedClaims: approved.length,
                totalPayout: approved.reduce((sum, c) => sum + (c.amountPayout || 0), 0)
            });

        } catch (err) {
            console.log('Sync Error:', err);
        }
    };

    const handleTriggerClaim = async (type) => {
        setLoadingMsg(`Acquiring GPS for ${type}...`);
        try {
            let lat = null, lon = null;

            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                lat = loc.coords.latitude;
                lon = loc.coords.longitude;
            }

            const token = await AsyncStorage.getItem('token');
            const res = await axios.post(`${API_URL}/claim/auto-trigger`,
                { disruptionType: type, lat, lon },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setLoadingMsg('');
            Alert.alert('✅ Claim Approved', res.data.message);
            loadAllData();
        } catch (err) {
            setLoadingMsg('');
            const reason = err.response?.data?.reason || 'Conditions map rejected';
            Alert.alert('🚨 Claim Rejected', reason);
        }
    };

    const handleWithdraw = async () => {
        if (!upiId.includes('@')) return Alert.alert('Invalid UPI', 'Please enter a valid VPA');
        if (Number(payoutAmount) > user.walletBalance) return Alert.alert('Error', 'Insufficient funds');

        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/auth/withdraw`,
                { upiId, amount: Number(payoutAmount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert('Success', `₹${payoutAmount} transferred to ${upiId}`);
            setShowPayoutModal(false);
            loadAllData();
        } catch (e) { Alert.alert('Error', 'Withdrawal failed'); }
    };

    const handleTopUp = async () => {
        if (!topUpAmount || isNaN(topUpAmount)) return;
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/auth/wallet/topup`,
                { amount: Number(topUpAmount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert('Success', 'Wallet topped up');
            setShowTopUpModal(false);
            setTopUpAmount('');
            loadAllData();
        } catch (e) { Alert.alert('Error', 'Top-up failed'); }
    };

    const handlePlanUpgrade = async (method) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/policy/change-plan`,
                { planName: selectedPlan, paymentMethod: method },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert('Success', `Upgraded to ${selectedPlan}`);
            setShowUpgradeModal(false);
            setSelectedPlan(null);
            loadAllData();
        } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Upgrade failed'); }
    };

    return (
        <ScrollView style={styles.container}>
            {/* --- MODALS --- */}
            {/* Menu Modal */}
            <Modal visible={showMenu} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.menuContainer}>
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Menu</Text>
                            <TouchableOpacity onPress={() => setShowMenu(false)}><Text style={{ fontSize: 24 }}>×</Text></TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate('Profile'); }}>
                            <Text style={styles.menuText}>👤 My Identity Vault</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate('Claims'); }}>
                            <Text style={styles.menuText}>🛡️ Claims History</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate('Withdrawals'); }}>
                            <Text style={styles.menuText}>💸 Payout History</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); Linking.openURL('mailto:support@deliveryshield.com'); }}>
                            <Text style={styles.menuText}>📧 Support Center</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.menuItem, { marginTop: 'auto' }]} onPress={async () => { await AsyncStorage.clear(); navigation.replace('Login'); }}>
                            <Text style={[styles.menuText, { color: '#EF4444' }]}>🚪 Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Payout Modal */}
            <Modal visible={showPayoutModal} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.cardModal}>
                        <Text style={styles.modalTitle}>Withdraw to Bank</Text>
                        <TextInput style={styles.input} placeholder="UPI ID (e.g. user@okicici)" value={upiId} onChangeText={setUpiId} autoCapitalize="none" />
                        <TextInput style={styles.input} placeholder="Amount (₹)" value={payoutAmount} onChangeText={setPayoutAmount} keyboardType="numeric" />
                        <View style={styles.row}>
                            <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowPayoutModal(false)}><Text>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.btnPrimary} onPress={handleWithdraw}><Text style={styles.whiteText}>Transfer</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* TopUp Modal */}
            <Modal visible={showTopUpModal} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.cardModal}>
                        <Text style={styles.modalTitle}>Add Wallet Funds</Text>
                        <TextInput style={styles.input} placeholder="Amount (₹)" value={topUpAmount} onChangeText={setTopUpAmount} keyboardType="numeric" />
                        <View style={styles.row}>
                            <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowTopUpModal(false)}><Text>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.btnSuccess} onPress={handleTopUp}><Text style={styles.whiteText}>Pay Now</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Upgrade Modal */}
            <Modal visible={showUpgradeModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <ScrollView contentContainerStyle={styles.upgradeContainer}>
                        <Text style={styles.modalTitle}>Upgrade Protection Tier</Text>
                        {['BETA PLAN', 'PRO LEVEL', 'ELITE CORP'].map(plan => (
                            <TouchableOpacity key={plan} style={[styles.planCard, selectedPlan === plan && styles.planSelected]} onPress={() => setSelectedPlan(plan)}>
                                <Text style={styles.planName}>{plan}</Text>
                                <Text style={styles.planPrice}>₹{PLAN_PRICES[plan]}/week</Text>
                                <Text style={styles.planBrief}>{plan === 'ELITE CORP' ? 'Full Traffic & Pollution Coverage' : 'Standard Disruptions'}</Text>
                            </TouchableOpacity>
                        ))}
                        {selectedPlan && (
                            <View style={styles.paymentSection}>
                                <Text style={styles.paymentTitle}>Pay for {selectedPlan}</Text>
                                <TouchableOpacity style={styles.btnSuccess} onPress={() => handlePlanUpgrade('wallet')}><Text style={styles.whiteText}>Pay from Wallet</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.btnPrimary, { marginTop: 10 }]} onPress={() => handlePlanUpgrade('razorpay')}><Text style={styles.whiteText}>Razorpay Checkout</Text></TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity style={styles.btnSecondary} onPress={() => { setShowUpgradeModal(false); setSelectedPlan(null); }}><Text>Close</Text></TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* --- DASHBOARD UI --- */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0]}</Text>
                    <Text style={styles.date}>{new Date().toDateString()}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.burger}><Text style={{ fontSize: 28 }}>☰</Text></TouchableOpacity>
            </View>

            {/* Insight Card */}
            {quote && (
                <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>💡 Smart Recommendation</Text>
                    <Text style={styles.insightText}>Consider upgrading to <Text style={{ fontWeight: 'bold' }}>{quote.recommendedPlan}</Text> based on recent conditions.</Text>
                </View>
            )}

            {/* Wallet Section */}
            <View style={styles.walletCard}>
                <View>
                    <Text style={styles.walletLabel}>Escrow Balance</Text>
                    <Text style={styles.walletValue}>₹{user?.walletBalance || 0}</Text>
                </View>
                <View style={styles.walletActions}>
                    <TouchableOpacity style={styles.walletBtnSmall} onPress={() => { setPayoutAmount(String(user?.walletBalance)); setShowPayoutModal(true); }}>
                        <Text style={styles.walletBtnText}>Withdraw</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.walletBtnSmall, { backgroundColor: '#fff', borderContext: '#1E3A8A' }]} onPress={() => setShowTopUpModal(true)}>
                        <Text style={[styles.walletBtnText, { color: '#1E3A8A' }]}>Add Funds</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Analytics Section */}
            <View style={styles.analyticsRow}>
                <View style={styles.analyticBox}>
                    <Text style={styles.analyticVal}>{stats.approvedClaims}</Text>
                    <Text style={styles.analyticLbl}>Approved</Text>
                </View>
                <View style={styles.analyticBox}>
                    <Text style={styles.analyticVal}>₹{stats.totalPayout}</Text>
                    <Text style={styles.analyticLbl}>Total Payout</Text>
                </View>
                <View style={styles.analyticBox}>
                    <Text style={styles.analyticVal}>{stats.totalClaims}</Text>
                    <Text style={styles.analyticLbl}>Total Claims</Text>
                </View>
            </View>

            {/* Policy Status */}
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.sectionTitle}>Policy Status</Text>
                    <Text style={[styles.badge, policy ? styles.badgeActive : styles.badgeInactive]}>{policy ? 'ACTIVE' : 'NO POLICY'}</Text>
                </View>
                {policy ? (
                    <View>
                        <Text style={styles.policyPlan}>{user?.currentPlan || 'BASIC'}</Text>
                        <Text style={styles.policyInfo}>Weekly Coverage: ₹{policy.incomeCovered}</Text>
                        <TouchableOpacity style={styles.upgradeBtn} onPress={() => setShowUpgradeModal(true)}>
                            <Text style={styles.upgradeBtnText}>UPGRADE PROTECTION 🚀</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('BuyPolicy')}>
                        <Text style={styles.whiteText}>Purchase Protection</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Claims Simulator */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>One-Tap Claims (Simulator)</Text>
                <Text style={styles.cardSub}>Trigger satellite verification via GPS signal</Text>

                {loadingMsg !== '' && (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator color="#1E3A8A" />
                        <Text style={styles.loadingText}>{loadingMsg}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.triggerBtn} onPress={() => handleTriggerClaim('Heavy Rain')} disabled={loadingMsg !== ''}>
                    <Text style={styles.triggerBtnText}>🌧️ Heavy Rain Warning</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.triggerBtn} onPress={() => handleTriggerClaim('Extreme Heat')} disabled={loadingMsg !== ''}>
                    <Text style={styles.triggerBtnText}>🌡️ Extreme Heat Alert</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.triggerBtn} onPress={() => handleTriggerClaim('Pollution')} disabled={loadingMsg !== ''}>
                    <Text style={styles.triggerBtnText}>🌫️ High AQI (Pollution)</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, marginTop: 40 },
    greeting: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
    date: { color: '#64748B', fontSize: 13, marginTop: 4 },
    burger: { padding: 5 },

    insightCard: { backgroundColor: '#EFF6FF', padding: 15, borderRadius: 15, borderLeftWidth: 5, borderLeftColor: '#3B82F6', marginBottom: 20 },
    insightTitle: { fontWeight: '800', color: '#1E40AF', fontSize: 13, marginBottom: 5 },
    insightText: { color: '#1E40AF', fontSize: 12 },

    walletCard: { backgroundColor: '#1E3A8A', padding: 25, borderRadius: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, elevation: 8, shadowColor: '#1E3A8A', shadowOpacity: 0.3, shadowRadius: 10 },
    walletLabel: { color: '#BFDBFE', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    walletValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 5 },
    walletActions: { gap: 10 },
    walletBtnSmall: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, alignItems: 'center' },
    walletBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },

    analyticsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    analyticBox: { flex: 1, backgroundColor: '#fff', marginHorizontal: 4, padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    analyticVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
    analyticLbl: { fontSize: 9, color: '#64748B', fontWeight: '700', marginTop: 4 },

    card: { backgroundColor: '#fff', padding: 20, borderRadius: 25, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    cardSub: { color: '#64748B', fontSize: 12, marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },

    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, fontSize: 10, fontWeight: '900' },
    badgeActive: { backgroundColor: '#D1FAE5', color: '#065F46' },
    badgeInactive: { backgroundColor: '#FEE2E2', color: '#991B1B' },

    policyPlan: { fontSize: 20, fontWeight: '900', color: '#1E3A8A' },
    policyInfo: { color: '#64748B', fontSize: 13, marginTop: 5, marginBottom: 20 },
    upgradeBtn: { backgroundColor: '#F59E0B', padding: 15, borderRadius: 15, alignItems: 'center' },
    upgradeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    triggerBtn: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    triggerBtnText: { fontWeight: '700', color: '#1E293B' },

    loadingBox: { padding: 15, backgroundColor: '#F8FAFC', borderRadius: 15, alignItems: 'center', marginBottom: 15 },
    loadingText: { color: '#1E3A8A', fontWeight: '600', fontSize: 12, marginTop: 8 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    menuContainer: { backgroundColor: '#fff', width: '80%', height: '100%', padding: 25, marginLeft: -20 },
    menuHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    menuTitle: { fontSize: 24, fontWeight: '900', color: '#1E3A8A' },
    menuItem: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    menuText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },

    cardModal: { backgroundColor: '#fff', padding: 25, borderRadius: 25 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 15, borderRadius: 12, marginBottom: 15 },
    btnPrimary: { backgroundColor: '#1E3A8A', padding: 16, borderRadius: 12, alignItems: 'center', flex: 1 },
    btnSuccess: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', flex: 1 },
    btnSecondary: { padding: 16, borderRadius: 12, alignItems: 'center', flex: 1 },
    whiteText: { color: '#fff', fontWeight: 'bold' },

    upgradeContainer: { backgroundColor: '#fff', borderRadius: 25, padding: 20 },
    planCard: { padding: 20, borderRadius: 20, borderWidth: 2, borderColor: '#F1F5F9', marginBottom: 15 },
    planSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    planName: { fontSize: 18, fontWeight: '900', color: '#1E3A8A' },
    planPrice: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginVertical: 5 },
    planBrief: { fontSize: 11, color: '#64748B' },
    paymentSection: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, marginBottom: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
    paymentTitle: { fontWeight: '800', color: '#1E3A8A', marginBottom: 15 }
});

export default DashboardScreen;
