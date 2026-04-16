import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../utils/api';

const AdminDashboardScreen = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#0F172A" /></View>;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>System Analytics</Text>
                <Text style={styles.subtitle}>Real-time platform operations monitoring</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{stats.totalUsers}</Text>
                    <Text style={styles.statLbl}>USERS</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{stats.activePolicies}</Text>
                    <Text style={styles.statLbl}>POLICIES</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statVal}>{stats.totalClaims}</Text>
                    <Text style={styles.statLbl}>CLAIMS</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statVal, { color: '#EF4444' }]}>{stats.rejectedClaims}</Text>
                    <Text style={styles.statLbl}>FRAUDS</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>CITY RISK HEATMAP</Text>
                {stats.cityRisk.map((city, idx) => (
                    <View key={idx} style={styles.listRow}>
                        <Text style={styles.rowText}>{city._id}</Text>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <Text style={styles.rowSub}>{city.users} Users</Text>
                            <Text style={styles.rowSub}>₹{Math.round(city.avgIncome || 0)} Avg</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>RECENT TRANSFERS</Text>
                {stats.recentClaims.map((claim, idx) => (
                    <View key={idx} style={styles.listRow}>
                        <View>
                            <Text style={styles.rowText}>{claim.user?.name || 'Worker'}</Text>
                            <Text style={styles.rowSub}>{claim.disruptionType}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.rowText, { color: claim.status === 'rejected' ? '#EF4444' : '#10B981' }]}>₹{claim.amountPayout}</Text>
                            <Text style={styles.rowSub}>{claim.status.toUpperCase()}</Text>
                        </View>
                    </View>
                ))}
            </View>
            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginTop: 30, marginBottom: 25 },
    title: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
    subtitle: { fontSize: 13, color: '#64748B', marginTop: 5 },

    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
    statBox: { flex: 1, minWidth: '45%', backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 3, borderWidth: 1, borderColor: '#E2E8F0' },
    statVal: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
    statLbl: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginTop: 4 },

    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 12, fontWeight: '900', color: '#64748B', letterSpacing: 1, marginBottom: 15 },
    listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    rowText: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    rowSub: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold' }
});

export default AdminDashboardScreen;
