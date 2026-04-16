import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_URL from '../utils/api';

const ClaimsScreen = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/claim`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClaims(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.claimCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.claimType}>{item.disruptionType.toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'rejected' ? '#FEE2E2' : '#DCFCE7' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'rejected' ? '#991B1B' : '#166534' }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.dataPoint}>
                    <Text style={styles.dataLabel}>DATE</Text>
                    <Text style={styles.dataVal}>{new Date(item.dateOfDisruption || item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.dataPoint}>
                    <Text style={styles.dataLabel}>PAYOUT</Text>
                    <Text style={[styles.dataVal, { fontWeight: '800' }]}>₹{item.amountPayout}</Text>
                </View>
                <View style={styles.dataPoint}>
                    <Text style={styles.dataLabel}>FRAUD SCORE</Text>
                    <Text style={[styles.dataVal, { color: item.isFraudulent ? '#EF4444' : '#10B981' }]}>
                        {item.fraudScore}%
                    </Text>
                </View>
            </View>

            {item.rejectionReason && (
                <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionText}>Reason: {item.rejectionReason}</Text>
                </View>
            )}
        </View>
    );

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#1E3A8A" /></View>;

    return (
        <View style={styles.container}>
            <FlatList
                data={claims}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.emptyText}>No claims found.</Text>}
                contentContainerStyle={{ padding: 15 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#64748B' },
    claimCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, elevation: 3, borderWidth: 1, borderColor: '#E2E8F0' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10 },
    claimType: { fontSize: 16, fontWeight: '900', color: '#1E3A8A' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '800' },
    cardBody: { flexDirection: 'row', justifyContent: 'space-between' },
    dataPoint: { flex: 1 },
    dataLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', marginBottom: 4 },
    dataVal: { fontSize: 13, color: '#1E293B', fontWeight: '600' },
    rejectionBox: { marginTop: 15, padding: 10, backgroundColor: '#FFF1F2', borderRadius: 8 },
    rejectionText: { color: '#E11D48', fontSize: 12, fontStyle: 'italic' }
});

export default ClaimsScreen;
