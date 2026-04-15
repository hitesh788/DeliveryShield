import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Banknote, CreditCard, ArrowRightLeft } from 'lucide-react';
import './Claims.css'; // Recycled enterprise table CSS

const API_URL = 'http://localhost:5000/api';

const Withdrawals = () => {
    const [withdrawals, setWithdrawals] = useState([]);

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
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Banknote color="#10B981" /> Automated Payout History</h2>
                    <p>Review all processed wallet withdrawals and destination UPI escrows</p>
                </div>
            </div>

            <div className="card">
                {withdrawals.length === 0 ? <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>No withdrawal history found.</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="claims-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Transaction Type</th>
                                    <th>Amount Disbursed</th>
                                    <th>Destination UPI Address</th>
                                    <th>RazorpayX Status</th>
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
                                                <ArrowRightLeft size={16} /> {tx.type.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td><span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10B981' }}>-₹{tx.amount}</span></td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <CreditCard size={16} /> {tx.upiId || 'N/A'}
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
