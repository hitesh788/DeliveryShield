import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Banknote, CreditCard, ArrowRightLeft } from 'lucide-react';
import './Claims.css'; // Recycled enterprise table CSS

const API_URL = 'http://localhost:5000/api';

const Withdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);

    const formatType = (tx) => {
        if (tx.type === 'plan_upgrade') return `PLAN CHANGE - ${tx.planName || 'PLAN'}`;
        if (tx.type === 'premium_payment') return 'POLICY PREMIUM';
        return tx.type.replace('_', ' ').toUpperCase();
    };

    const formatAmount = (tx) => {
        const isDebit = tx.type === 'wallet_withdrawal' || tx.paymentMethod === 'wallet';
        return `${isDebit ? '-' : ''}₹${tx.amount}`;
    };

    useEffect(() => {
        const fetchWithdrawals = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/auth/withdrawals`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWithdrawals(res.data);
            } catch (err) {
                toast.error("Failed to load withdrawal history");
            }
        };
        fetchWithdrawals();
    }, []);

    return (
        <div className="claims-container">
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <div className="welcome-text">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Banknote color="#10B981" /> Payout & Payment History</h2>
                    <p>Review wallet withdrawals, policy payments, and plan changes</p>
                </div>
            </div>

            <div className="card">
                {withdrawals.length === 0 ? <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>No payment history found.</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="claims-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Transaction Type</th>
                                    <th>Amount</th>
                                    <th>Payment / Destination</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.map((tx) => (
                                    <tr key={tx._id}>
                                        <td>
                                            <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                                                {new Date(tx.transactionDate).toLocaleString()}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 'bold', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ArrowRightLeft size={16} /> {formatType(tx)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold',
                                                color: tx.type === 'wallet_withdrawal' || tx.paymentMethod === 'wallet' ? '#EF4444' : '#10B981'
                                            }}>
                                                {formatAmount(tx)}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <CreditCard size={16} /> {tx.upiId || tx.paymentMethod?.toUpperCase() || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${tx.status}`}>{tx.status.toUpperCase()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Withdrawals;
