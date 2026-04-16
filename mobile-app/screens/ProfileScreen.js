import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, Modal, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_URL from '../utils/api';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ totalClaims: 0, approvedClaims: 0, totalPayout: 0 });
    const [loading, setLoading] = useState(true);

    // Form State
    const [form, setForm] = useState({
        name: '',
        city: 'Mumbai',
        platform: 'Zomato',
        upiId: '',
        platformId: '',
        averageWeeklyIncome: '4000'
    });

    // UI States
    const [showCityPicker, setShowCityPicker] = useState(false);
    const [showPlatformPicker, setShowPlatformPicker] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const [userRes, claimsRes] = await Promise.all([
                axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/claim`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setUser(userRes.data);
            setForm({
                name: userRes.data.name || '',
                city: userRes.data.city || 'Mumbai',
                platform: userRes.data.platform || 'Zomato',
                platformId: userRes.data.platformId || '',
                upiId: userRes.data.upiId || '',
                averageWeeklyIncome: String(userRes.data.averageWeeklyIncome || '4000')
            });

            const claims = claimsRes.data || [];
            const approved = claims.filter(c => c.status === 'approved' || c.status === 'auto-approved');
            setStats({
                totalClaims: claims.length,
                approvedClaims: approved.length,
                totalPayout: approved.reduce((sum, c) => sum + (c.amountPayout || 0), 0)
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.put(`${API_URL}/auth/profile`, {
                ...form,
                averageWeeklyIncome: Number(form.averageWeeklyIncome)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data.user);
            await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
            Alert.alert('Success ✅', 'Identity Vault synchronized successfully');
        } catch (err) {
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1E3A8A" />
            <Text style={{ marginTop: 10, color: '#64748B' }}>Decrypting Vault...</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            {/* Round Profile Hero - Web Parity Header */}
            <View style={styles.hero}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.name?.substring(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                    </View>
                </View>
                <Text style={styles.userName}>{user?.name}</Text>
                <View style={styles.badgeRow}>
                    <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>ID: {user?.platformId || 'UNSET'}</Text></View>
                    <View style={[styles.miniBadge, { backgroundColor: '#F59E0B' }]}><Text style={[styles.miniBadgeText, { color: '#92400E' }]}>VERIFIED</Text></View>
                </View>
            </View>

            {/* Reputation Hub */}
            <View style={styles.hub}>
                <Text style={styles.hubTitle}>REPUTATION HUB</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.hubBox}>
                        <Text style={styles.hubIcon}>⭐</Text>
                        <Text style={styles.hubVal}>{user?.rating || '4.8'}</Text>
                        <Text style={styles.hubLbl}>RATING</Text>
                    </View>
                    <View style={styles.hubBox}>
                        <Text style={styles.hubIcon}>💬</Text>
                        <Text style={styles.hubVal}>{user?.feedbackCount || '12'}</Text>
                        <Text style={styles.hubLbl}>FEEDBACK</Text>
                    </View>
                    <View style={styles.hubBox}>
                        <Text style={styles.hubIcon}>⚠️</Text>
                        <Text style={styles.hubVal}>0</Text>
                        <Text style={styles.hubLbl}>ALERTS</Text>
                    </View>
                </View>
            </View>

            {/* Editable Identity Details */}
            <View style={styles.formCard}>
                <View style={styles.formHeader}>
                    <Text style={styles.sectionTitle}>SECURE IDENTITY DETAILS</Text>
                    <TouchableOpacity onPress={handleUpdate} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>SAVE</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Full Legal Name</Text>
                <TextInput style={styles.input} value={form.name} onChangeText={t => setForm({ ...form, name: t })} />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Operational Hub</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowCityPicker(true)}>
                            <Text style={styles.pickerText}>{form.city} ▽</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Platform</Text>
                        <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowPlatformPicker(true)}>
                            <Text style={styles.pickerText}>{form.platform} ▽</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.label}>Average Weekly Income (₹)</Text>
                <TextInput style={styles.input} value={form.averageWeeklyIncome} onChangeText={t => setForm({ ...form, averageWeeklyIncome: t })} keyboardType="numeric" />

                <Text style={styles.label}>Settlement UPI ID</Text>
                <TextInput style={styles.input} value={form.upiId} onChangeText={t => setForm({ ...form, upiId: t })} placeholder="username@upi" autoCapitalize="none" />

                <Text style={styles.label}>Platform Rider ID</Text>
                <TextInput style={styles.input} value={form.platformId} onChangeText={t => setForm({ ...form, platformId: t })} placeholder="ZM-10293" />
            </View>

            {/* Performance Snapshot */}
            <View style={styles.perfCard}>
                <Text style={styles.sectionTitle}>PERFORMANCE SNAPSHOT</Text>
                <View style={styles.pItem}>
                    <Text style={styles.pLabel}>Total Claims Filed</Text>
                    <Text style={styles.pVal}>{stats.totalClaims}</Text>
                </View>
                <View style={styles.pItem}>
                    <Text style={styles.pLabel}>Approved Claims</Text>
                    <Text style={[styles.pVal, { color: '#10B981' }]}>{stats.approvedClaims}</Text>
                </View>
                <View style={styles.pItem}>
                    <Text style={styles.pLabel}>Total Earnings Secured</Text>
                    <Text style={styles.pVal}>₹{stats.totalPayout}</Text>
                </View>
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

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EFF6FF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    hero: { backgroundColor: '#1E3A8A', paddingVertical: 50, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 10 },
    avatarContainer: { position: 'relative', marginBottom: 20 },
    avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', borderWidth: 5, borderColor: '#fff' },
    avatarText: { color: '#fff', fontSize: 38, fontWeight: '900' },
    verifiedBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#10B981', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
    userName: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 10 },
    badgeRow: { flexDirection: 'row', gap: 10 },
    miniBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    miniBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    hub: { padding: 25 },
    hubTitle: { fontSize: 12, fontWeight: '900', color: '#1E3A8A', letterSpacing: 1, marginBottom: 15 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    hubBox: { width: (width - 70) / 3, backgroundColor: '#fff', padding: 15, borderRadius: 20, alignItems: 'center', elevation: 3 },
    hubIcon: { fontSize: 18, marginBottom: 5 },
    hubVal: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
    hubLbl: { fontSize: 8, fontWeight: '700', color: '#64748B', marginTop: 3 },

    formCard: { backgroundColor: '#fff', margin: 25, marginTop: 0, padding: 25, borderRadius: 30, elevation: 5 },
    formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 15 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
    saveBtn: { backgroundColor: '#1E3A8A', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

    label: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 15, borderRadius: 12, fontSize: 15, color: '#1E293B' },
    row: { flexDirection: 'row' },
    pickerTrigger: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 15, borderRadius: 12 },
    pickerText: { fontSize: 15, color: '#1E293B', fontWeight: '600' },

    perfCard: { backgroundColor: '#1E293B', margin: 25, marginTop: 0, padding: 25, borderRadius: 30 },
    pItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 10 },
    pLabel: { color: '#94A3B8', fontSize: 13 },
    pVal: { color: '#fff', fontSize: 15, fontWeight: '800' },

    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    pickerMenu: { backgroundColor: '#fff', width: '80%', borderRadius: 25, padding: 15 },
    pickerItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    pickerItemText: { fontSize: 16, textAlign: 'center', fontWeight: '700', color: '#1E293B' }
});

export default ProfileScreen;
