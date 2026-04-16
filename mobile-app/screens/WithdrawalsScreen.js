import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_URL from '../utils/api';

const WithdrawalsScreen = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/auth/transactions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWithdrawals(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatType = (type) => {
        return type.replace('_', ' ').toUpperCase();
    };

    const renderItem = ({ item }) => (
        <View style={styles.txCard}>
            <View style={styles.txHeader}>
                <Text style={styles.txDate}>{new Date(item.transactionDate || item.createdAt).toLocaleDateString()}</Text>
                <View style={[styles.badge, { backgroundColor: item.status === 'success' ? '#DCFCE7' : '#FEE2E2' }]}>
                    <Text style={[styles.badgeText, { color: item.status === 'success' ? '#166534' : '#991B1B' }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.txBody}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.txType}>{formatType(item.type)}</Text>
                    <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
                </View>
                <Text style={[styles.txAmount, { color: item.type.includes('withdrawal') || item.paymentMethod === 'wallet' ? '#EF4444' : '#10B981' }]}>
                    {item.type.includes('withdrawal') || item.paymentMethod === 'wallet' ? '-' : '+'}₹{item.amount}
                </Text>
            </View>

            <View style={styles.txFooter}>
                <Text style={styles.footerLabel}>Balance After: <Text style={{ fontWeight: '700' }}>₹{item.balanceAfter ?? 'N/A'}</Text></Text>
            </View>
        </View>
    );

    if (loading) return (
        <View style={styles.centered}><ActivityIndicator size="large" color="#1E3A8A" /></View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={withdrawals}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.emptyText}>No transaction history found.</Text>}
                contentContainerStyle={{ padding: 15 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#64748B' },
    txCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
    txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    txDate: { color: '#64748B', fontSize: 12 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    txBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    txType: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
    txDesc: { fontSize: 12, color: '#64748B' },
    txAmount: { fontSize: 18, fontWeight: '800' },
    txFooter: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    footerLabel: { fontSize: 11, color: '#64748B' }
});

export default WithdrawalsScreen;
