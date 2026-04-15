import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:5000/api';

const ClaimsScreen = () => {
    const [claims, setClaims] = useState([]);

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/claim`, { headers: { Authorization: `Bearer ${token}` } });
            setClaims(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.disruptionType}</Text>
                <Text style={styles.date}>{new Date(item.dateOfDisruption).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.amount}>Payout: ₹{item.amountPayout}</Text>

            <View style={styles.row}>
                <Text style={[styles.status, item.status === 'auto-approved' ? styles.successText : styles.dangerText]}>
                    {item.status.toUpperCase()}
                </Text>
                {item.isFraudulent && <Text style={styles.dangerText}>FLAGGED</Text>}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {claims.length === 0 ? (
                <Text style={styles.empty}>No automated claims found.</Text>
            ) : (
                <FlatList
                    data={claims}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#F3F4F6' },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    bold: { fontWeight: 'bold', fontSize: 16 },
    date: { color: 'gray' },
    amount: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
    status: { padding: 5, borderRadius: 5, fontWeight: 'bold', fontSize: 12 },
    successText: { color: '#10B981' },
    dangerText: { color: '#EF4444' },
    empty: { textAlign: 'center', marginTop: 20, color: 'gray' }
});

export default ClaimsScreen;
