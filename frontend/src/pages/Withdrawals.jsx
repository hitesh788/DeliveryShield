import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Banknote, CreditCard, ArrowRightLeft } from 'lucide-react';
import API_URL from '../config';
import './Claims.css'; // Recycled enterprise table CSS

const Withdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    const [filter, setFilter] = useState('all');

    const formatType = (tx) => {
        if (tx.type === 'plan_upgrade') return `PLAN CHANGE - ${tx.planName || 'PLAN'}`;
        if (tx.type === 'premium_payment') return 'POLICY PREMIUM';
        if (tx.type === 'wallet_topup') return 'WALLET TOP-UP';
        if (tx.type === 'claim_payout') return 'CLAIM PAYOUT';
        return tx.type.replace('_', ' ').toUpperCase();
    };

    const formatAmount = (tx) => {
        const isDebit = tx.type === 'wallet_withdrawal' || (tx.type === 'plan_upgrade' && tx.paymentMethod === 'wallet');
        return `${isDebit ? '-' : ''}₹${tx.amount}`;
    };

    const fetchWithdrawals = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/auth/transactions?type=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWithdrawals(res.data);
        } catch (err) {
            toast.error("Failed to load payment history");
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, [filter]);

    return (
        <div className="claims-container">
            <div className="dashboard-header" style={{ marginBottom: '20px' }}>
                <div className="welcome-text">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Banknote color="#10B981" /> Payout & Payment History</h2>
                    <p>Review wallet withdrawals, policy payments, and plan changes</p>
                </div>
                <select className="modal-input" style={{ width: '260px', margin: 0, textAlign: 'left' }} value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="all">All transactions</option>
                    <option value="claim_payout">Claim payouts</option>
                    <option value="wallet_topup">Wallet top-ups</option>
                    <option value="wallet_withdrawal">Wallet withdrawals</option>
                    <option value="plan_upgrade">Plan payments</option>
                    <option value="premium_payment">Policy premiums</option>
                </select>
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
                                    <th>Balance After</th>
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
                                                ₹{tx.balanceAfter ?? 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <CreditCard size={16} /> {tx.upiId || tx.paymentMethod?.toUpperCase() || tx.description || 'N/A'}
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
